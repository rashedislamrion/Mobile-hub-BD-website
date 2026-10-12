import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PaymentGatewayName, PaymentStatus } from '@prisma/client';

@Injectable()
export class SslcommerzService {
  private readonly logger = new Logger(SslcommerzService.name);
  constructor(private prisma: PrismaService) {}

  private async getCredentials() {
    const config = await this.prisma.paymentGatewayConfig.findUnique({
      where: { gateway: PaymentGatewayName.SSLCOMMERZ },
    });

    if (!config || !config.isActive) {
      throw new BadRequestException('SSLCommerz is not currently available.');
    }

    const creds = (config.credentials || {}) as Record<string, any>;
    const storeId = creds.storeId || creds.store_id;
    const storePassword =
      creds.storePassword || creds.store_passwd || creds.storePasswd;

    if (!storeId || !storePassword) {
      throw new BadRequestException(
        'SSLCommerz credentials are not fully configured in admin settings.',
      );
    }

    const isLive = config.mode === 'Live';
    const baseUrl = isLive
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';

    return { storeId, storePassword, baseUrl, config };
  }

  async initiate(orderId: string, apiBaseUrl?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: true,
        shippingAddress: true,
      },
    });
    if (!order) throw new NotFoundException(`Order "${orderId}" not found.`);

    const { storeId, storePassword, baseUrl } = await this.getCredentials();

    const apiBase =
      apiBaseUrl || process.env.API_URL || 'http://localhost:4000/api/v1';
    const successUrl = `${apiBase}/payments/sslcommerz/success?orderId=${order.id}`;
    const failUrl = `${apiBase}/payments/sslcommerz/fail?orderId=${order.id}`;
    const cancelUrl = `${apiBase}/payments/sslcommerz/cancel?orderId=${order.id}`;
    const ipnUrl = `${apiBase}/payments/sslcommerz/ipn`;

    const params = new URLSearchParams();
    params.append('store_id', storeId);
    params.append('store_passwd', storePassword);
    params.append('total_amount', Number(order.totalAmount).toFixed(2));
    params.append('currency', 'BDT');
    params.append('tran_id', order.id);
    params.append('success_url', successUrl);
    params.append('fail_url', failUrl);
    params.append('cancel_url', cancelUrl);
    params.append('ipn_url', ipnUrl);
    params.append('cus_name', order.customer?.name || 'Valued Customer');
    params.append(
      'cus_email',
      order.customer?.email || 'mobilehubbd2@gmail.com',
    );
    params.append(
      'cus_add1',
      order.shippingAddress?.fullAddress || 'Dhaka, Bangladesh',
    );
    params.append('cus_city', 'Dhaka');
    params.append('cus_country', 'Bangladesh');
    params.append('shipping_method', 'Courier');
    params.append('product_name', order.orderCode);
    params.append('product_category', 'Mobile & Electronics');
    params.append('product_profile', 'general');

    const res = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();

    if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
      throw new BadRequestException(
        `SSLCommerz session creation failed: ${data.failedreason || JSON.stringify(data)}`,
      );
    }

    await this.prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        gateway: PaymentGatewayName.SSLCOMMERZ,
        gatewayRef: data.sessionkey || null,
        status: 'INITIATED',
        rawResponse: data,
      },
    });

    return {
      GatewayPageURL: data.GatewayPageURL,
      sessionkey: data.sessionkey,
    };
  }

  async validateAndMarkPaid(
    valId: string,
    tranId: string,
    bankTranId?: string,
  ) {
    const { storeId, storePassword, baseUrl } = await this.getCredentials();

    const valUrl = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePassword)}&v=1&format=json`;

    const res = await fetch(valUrl);
    const data = await res.json();

    if (data.status === 'VALID' || data.status === 'VALIDATED') {
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: tranId },
          include: { items: true },
        });
        if (!order) return;

        // 1. Atomically claim the order inside tx
        const claimResult = await tx.order.updateMany({
          where: {
            id: tranId,
            paymentStatus: { not: PaymentStatus.PAID },
          },
          data: {
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: 'SSLCOMMERZ',
            paidAmount: order.totalAmount,
            dueAmount: 0,
            status: OrderStatus.CONFIRMED,
          },
        });

        if (claimResult.count === 0) {
          // Already claimed / processed by a concurrent or previous IPN
          return;
        }

        // 2. Conditional stock decrements using the SAME transaction client (tx)
        let stockDeducted = true;
        let deficitReason = '';
        const decrementedItems: { variantId: string; quantity: number; branchId?: string }[] = [];

        for (const item of order.items) {
          if (item.variantId) {
            const variantUpdate = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                stock: { gte: item.quantity },
              },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            if (variantUpdate.count === 0) {
              stockDeducted = false;
              deficitReason = `Insufficient global stock for variant ${item.variantId} (requested ${item.quantity})`;
              break;
            }

            if (order.branchId) {
              const branchUpdate = await tx.branchInventory.updateMany({
                where: {
                  branchId: order.branchId,
                  productVariantId: item.variantId,
                  quantity: { gte: item.quantity },
                },
                data: {
                  quantity: { decrement: item.quantity },
                },
              });

              if (branchUpdate.count === 0) {
                // Revert this variant global decrement
                await tx.productVariant.updateMany({
                  where: { id: item.variantId },
                  data: { stock: { increment: item.quantity } },
                });
                stockDeducted = false;
                deficitReason = `Insufficient branch stock for variant ${item.variantId} at branch ${order.branchId} (requested ${item.quantity})`;
                break;
              }
            }

            decrementedItems.push({
              variantId: item.variantId,
              quantity: item.quantity,
              branchId: order.branchId || undefined,
            });
          }
        }

        // If any item failed, revert all previous decrements in tx
        if (!stockDeducted) {
          for (const dec of decrementedItems) {
            await tx.productVariant.updateMany({
              where: { id: dec.variantId },
              data: { stock: { increment: dec.quantity } },
            });
            if (dec.branchId) {
              await tx.branchInventory.updateMany({
                where: { branchId: dec.branchId, productVariantId: dec.variantId },
                data: { quantity: { increment: dec.quantity } },
              });
            }
          }

          this.logger.warn(
            `[STOCK DEFICIT] Order ${order.id} paid via SSLCommerz (ValID: ${valId}) but conditional stock decrement failed: ${deficitReason}. Marked for stock review.`,
          );
        }

        // Update order stock review flags if stock was insufficient
        await tx.order.update({
          where: { id: tranId },
          data: {
            needsStockReview: !stockDeducted,
            stockReviewNote: stockDeducted
              ? null
              : `Stock exhausted after payment: ${deficitReason}`,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: tranId,
            status: OrderStatus.CONFIRMED,
            note: stockDeducted
              ? `Payment validated via SSLCommerz (ValID: ${valId}, BankTranID: ${bankTranId || data.bank_tran_id || 'N/A'}). Stock decremented successfully.`
              : `[NEEDS STOCK REVIEW] Payment validated via SSLCommerz (ValID: ${valId}), but insufficient inventory: ${deficitReason}. Inventory was NOT deducted.`,
          },
        });

        await tx.paymentAttempt.updateMany({
          where: { orderId: tranId, gateway: PaymentGatewayName.SSLCOMMERZ },
          data: {
            status: 'SUCCESS',
            gatewayRef: valId,
            rawResponse: data,
          },
        });
      });
      return true;
    }
    return false;
  }

  async handleIPN(payload: any) {
    const valId = payload.val_id;
    const tranId = payload.tran_id;
    const bankTranId = payload.bank_tran_id;

    if (valId && tranId) {
      const isValid = await this.validateAndMarkPaid(valId, tranId, bankTranId);
      return { status: isValid ? 'SUCCESS' : 'FAILED' };
    }
    return { status: 'INVALID_PAYLOAD' };
  }

  async handleSuccess(query: any, body: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderId = query?.orderId || body?.tran_id || query?.tran_id;
    const valId = body?.val_id || query?.val_id;
    const bankTranId = body?.bank_tran_id || query?.bank_tran_id;

    if (valId && orderId) {
      try {
        await this.validateAndMarkPaid(valId, orderId, bankTranId);
      } catch (e) {
        // Log validation error
      }
    }

    return `${frontendUrl}/order/confirmation/${orderId || ''}`;
  }

  async handleFail(query: any, body: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderId = query?.orderId || body?.tran_id || query?.tran_id;
    return `${frontendUrl}/order/payment-failed?orderId=${orderId || ''}&reason=Failed`;
  }

  async handleCancel(query: any, body: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderId = query?.orderId || body?.tran_id || query?.tran_id;
    return `${frontendUrl}/order/payment-failed?orderId=${orderId || ''}&reason=Cancelled`;
  }
}
