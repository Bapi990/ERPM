// Indian English currency words converter (Crores, Lakhs, Thousands, Hundreds, Paise)
export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'INR Zero Rupees Only';

  const absAmount = Math.abs(amount);
  const intPart = Math.floor(absAmount);
  const paise = Math.round((absAmount - intPart) * 100);

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertUptoThousand(n: number): string {
    let res = '';
    if (n >= 100) {
      res += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      res += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      res += units[n] + ' ';
    }
    return res.trim();
  }

  let words = '';
  let n = intPart;

  const crores = Math.floor(n / 10000000);
  if (crores > 0) {
    words += convertUptoThousand(crores) + ' Crore ';
    n %= 10000000;
  }

  const lakhs = Math.floor(n / 100000);
  if (lakhs > 0) {
    words += convertUptoThousand(lakhs) + ' Lakh ';
    n %= 100000;
  }

  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    words += convertUptoThousand(thousands) + ' Thousand ';
    n %= 1000;
  }

  if (n > 0) {
    words += convertUptoThousand(n) + ' ';
  }

  words = words.trim();
  let result = words ? `INR ${words} Rupees` : 'INR Zero Rupees';

  if (paise > 0) {
    result += ` And ${convertUptoThousand(paise)} Paise`;
  }

  return `${result} Only`;
}
