import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PaymentGatewayName, PaymentStatus } from '@prisma/client';

@Injectable()
export class BkashService {
  private readonly logger = new Logger(BkashService.name);

  constructor(private prisma: PrismaService) {}

  private async getCredentials() {
    const config = await this.prisma.paymentGatewayConfig.findUnique({
      where: { gateway: PaymentGatewayName.BKASH },
    });

    if (!config || !config.isActive) {
      throw new BadRequestException('bKash is not currently available.');
    }

    const creds = (config.credentials || {}) as Record<string, any>;
    const appKey = creds.appKey || creds.app_key;
    const appSecretKey =
      creds.appSecretKey || creds.app_secret || creds.appSecret;
    const username = creds.username;
    const password = creds.password;

    if (!appKey || !appSecretKey || !username || !password) {
      throw new BadRequestException(
        'bKash credentials are not fully configured in admin settings.',
      );
    }

    const isLive = config.mode === 'Live';
    const baseUrl = isLive
      ? 'https://tokenized.pay.bka.sh/v2.0.0'
      : 'https://tokenized.sandbox.bka.sh/v2.0.0';

    return { appKey, appSecretKey, username, password, baseUrl, config };
  }

  private async grantToken(
    baseUrl: string,
    appKey: string,
    appSecretKey: string,
    username: string,
    password: string,
  ) {
    const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        username,
        password,
      },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecretKey,
      }),
    });

    const data = await res.json();
    if (!data.id_token) {
      throw new BadRequestException(
        `Failed to grant bKash token: ${data.statusMessage || JSON.stringify(data)}`,
      );
    }
    return data.id_token as string;
  }

  async initiate(orderId: string, callbackBaseUrl?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order "${orderId}" not found.`);

    const { appKey, appSecretKey, username, password, baseUrl } =
      await this.getCredentials();

    const idToken = await this.grantToken(
      baseUrl,
      appKey,
      appSecretKey,
      username,
      password,
    );

    const apiBase =
      callbackBaseUrl || process.env.API_URL || 'http://localhost:4000/api/v1';
    const callbackURL = `${apiBase}/payments/bkash/callback?orderId=${order.id}`;

    const createRes = await fetch(`${baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: idToken,
        'X-APP-Key': appKey,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: order.customerId || 'GUEST',
        callbackURL,
        amount: Number(order.totalAmount).toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: order.orderCode,
      }),
    });

    const createData = await createRes.json();

    if (!createData.paymentID || !createData.bkashURL) {
      throw new BadRequestException(
        `bKash payment create failed: ${createData.statusMessage || JSON.stringify(createData)}`,
      );
    }

    // Save payment attempt
    await this.prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        gateway: PaymentGatewayName.BKASH,
        gatewayRef: createData.paymentID,
        status: 'INITIATED',
        rawResponse: createData,
      },
    });

    return {
      bkashURL: createData.bkashURL,
      paymentID: createData.paymentID,
    };
  }

  async handleCallback(query: {
    paymentID?: string;
    status?: string;
    orderId?: string;
  }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const { paymentID, status, orderId } = query;

    if (!paymentID || status !== 'success') {
      if (orderId) {
        await this.prisma.paymentAttempt.updateMany({
          where: {
            orderId,
            gateway: PaymentGatewayName.BKASH,
            gatewayRef: paymentID,
          },
          data: { status: 'FAILED' },
        });
      }
      return `${frontendUrl}/order/payment-failed?orderId=${orderId || ''}&reason=${status || 'cancel'}`;
    }

    try {
      const { appKey, appSecretKey, username, password, baseUrl } =
        await this.getCredentials();
      const idToken = await this.grantToken(
        baseUrl,
        appKey,
        appSecretKey,
        username,
        password,
      );

      const executeRes = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: idToken,
          'X-APP-Key': appKey,
        },
        body: JSON.stringify({ paymentID }),
      });

      const executeData = await executeRes.json();

      if (executeData.statusCode === '0000' && executeData.trxID) {
        // Find order
        let targetOrderId = orderId;
        if (!targetOrderId) {
          const attempt = await this.prisma.paymentAttempt.findFirst({
            where: { gatewayRef: paymentID },
          });
          targetOrderId = attempt?.orderId;
        }

        if (!targetOrderId) {
          return `${frontendUrl}/order/payment-failed?reason=OrderNotFound`;
        }

        await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: targetOrderId },
            include: { items: true },
          });
          if (!order) return;

          // 1. Atomically claim the order inside tx
          const claimResult = await tx.order.updateMany({
            where: {
              id: targetOrderId,
              paymentStatus: { not: PaymentStatus.PAID },
            },
            data: {
              paymentStatus: PaymentStatus.PAID,
              paymentMethod: 'BKASH',
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
              `[STOCK DEFICIT] Order ${order.id} paid via bKash (TrxID: ${executeData.trxID}) but conditional stock decrement failed: ${deficitReason}. Marked for stock review.`,
            );
          }

          // Update order stock review flags if stock was insufficient
          await tx.order.update({
            where: { id: targetOrderId },
            data: {
              needsStockReview: !stockDeducted,
              stockReviewNote: stockDeducted
                ? null
                : `Stock exhausted after payment: ${deficitReason}`,
            },
          });

          // Status history
          await tx.orderStatusHistory.create({
            data: {
              orderId: targetOrderId,
              status: OrderStatus.CONFIRMED,
              note: stockDeducted
                ? `Payment confirmed via bKash (TrxID: ${executeData.trxID}). Stock decremented successfully.`
                : `[NEEDS STOCK REVIEW] Payment confirmed via bKash (TrxID: ${executeData.trxID}), but insufficient inventory: ${deficitReason}. Inventory was NOT deducted.`,
            },
          });

          // Update payment attempt
          await tx.paymentAttempt.updateMany({
            where: { orderId: targetOrderId, gatewayRef: paymentID },
            data: {
              status: 'SUCCESS',
              rawResponse: executeData,
            },
          });
        });

        return `${frontendUrl}/order/confirmation/${targetOrderId}`;
      } else {
        return `${frontendUrl}/order/payment-failed?orderId=${orderId || ''}&reason=${executeData.statusMessage || 'PaymentExecutionFailed'}`;
      }
    } catch (err: any) {
      return `${frontendUrl}/order/payment-failed?orderId=${orderId || ''}&reason=${encodeURIComponent(err.message || 'Error')}`;
    }
  }
}
