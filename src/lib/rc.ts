import { Purchases } from '@revenuecat/purchases-js';

export function initRC() {
  Purchases.configure({ apiKey: import.meta.env.VITE_RC_PUBLIC! });
}