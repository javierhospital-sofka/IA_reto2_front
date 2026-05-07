import { expect, type Page } from "@playwright/test";

/**
 * Login con el usuario demo y espera al dashboard. Reusable entre flows.
 */
export async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/^email$/i).fill("admin.retail@sofka.local");
  await page.getByLabel(/^password$/i).fill("RetailDemo2026!");
  await page.getByRole("button", { name: /ingresar/i }).click();

  // Tras login → /inventario
  await expect(page).toHaveURL(/\/inventario$/);
  await expect(page.getByRole("heading", { level: 1, name: /resumen/i })).toBeVisible();
}

/**
 * Activa la primera sede que encuentre en la tabla de inventarios del dashboard.
 * El backend hace auto-seed al arrancar, así que siempre hay 24 inventarios listos.
 */
export async function activateFirstSede(page: Page) {
  await page.goto("/inventario");
  // Esperar a que la tabla cargue (TanStack Query)
  await expect(page.getByRole("heading", { level: 2, name: /^inventarios$/i })).toBeVisible();
  // Click en la primera fila clickable de la tabla de inventarios
  const firstRow = page.locator(".table--clickable tbody tr").first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.click();
  // Tras activar sede → vamos a /products
  await expect(page).toHaveURL(/\/inventories\/[^/]+\/products$/);
}
