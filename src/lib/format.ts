export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const discountPct = (mrp: number, price: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;