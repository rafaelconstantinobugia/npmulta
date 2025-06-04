import { Purchases } from '@revenuecat/purchases-js';

export function initRC() {
  if (import.meta.env.VITE_FREE_MODE === 'true') return;
  Purchases.configure({ apiKey: import.meta.env.VITE_RC_PUBLIC || 'rcb_YFoqIkzNDhDXFCqymyjjPyeVYukx' });
}