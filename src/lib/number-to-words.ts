/**
 * Converts numeric monetary amounts into English currency words (Bangladeshi Taka standard).
 * e.g. 145000 -> "One Lakh Forty-Five Thousand Taka Only"
 */
export function numberToWords(amount: number | string | null | undefined): string {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return "Zero Taka Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    return o ? `${t}-${o}` : t;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const hStr = hundred > 0 ? `${ones[hundred]} Hundred` : "";
    const rStr = remainder > 0 ? convertTwoDigits(remainder) : "";
    if (hStr && rStr) return `${hStr} ${rStr}`;
    return hStr || rStr;
  }

  let words = "";

  // Crores (>= 1,00,00,000)
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;

  if (crore > 0) {
    words += `${crore < 100 ? convertTwoDigits(crore) : convertThreeDigits(crore)} Crore `;
  }

  // Lakhs (>= 1,00,000)
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }

  // Thousands (>= 1,000)
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }

  // Remaining Hundreds + Tens + Ones
  if (rem > 0) {
    words += `${convertThreeDigits(rem)} `;
  }

  return `${words.trim()} Taka Only`;
}
