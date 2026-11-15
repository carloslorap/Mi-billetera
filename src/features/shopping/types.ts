export type Product = {
  id: string;
  barcode: string;
  name: string | null;
  priceCents: number;
};

export type Trip = { id: string; budgetCents: number | null };

export type TripItem = {
  id: string;
  productId: string | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
};