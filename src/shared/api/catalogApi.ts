import type { CatalogProduct, Store } from './contracts';
import { apiRequest } from './httpClient';

export function getStores() {
  return apiRequest<{ data: Store[] }>('core', '/v1/stores');
}

export function getCatalogProducts() {
  return apiRequest<{ data: CatalogProduct[] }>('core', '/v1/products');
}
