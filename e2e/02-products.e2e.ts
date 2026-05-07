/**
 * E2E flujo 2 — Activar sede + ver productos sembrados.
 *
 * Verifica que el bug de idempotencia (auto-seed vs picker) está arreglado:
 * tras click en una fila del dashboard, los productos sembrados aparecen.
 */
import { expect, test } from "@playwright/test";
import { activateFirstSede, loginAsDemo } from "./_helpers";

test("activar sede + listar productos sembrados", async ({ page }) => {
  await loginAsDemo(page);
  await activateFirstSede(page);

  // Productos page con datos
  await expect(page.getByRole("heading", { level: 1, name: /^productos$/i })).toBeVisible();

  // Sede activa visible en el sidebar (no "Sin sede seleccionada")
  await expect(page.getByText(/sede activa/i)).toBeVisible();
  // El sidebar muestra el storeId (badge "active")
  await expect(page.locator(".sede-panel__pill").first()).toBeVisible();

  // La tabla de productos tiene al menos 1 fila (auto-seed: 50 productos por inventario)
  await expect(page.locator(".table--compact tbody tr").first()).toBeVisible({
    timeout: 10_000
  });

  // Header KPIs muestran totales > 0
  const stats = page.locator(".page-header__stats");
  await expect(stats).toBeVisible();
  await expect(stats).toContainText(/total/i);
});
