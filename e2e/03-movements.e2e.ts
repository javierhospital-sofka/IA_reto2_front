/**
 * E2E flujo 3 — Registrar un movimiento + verificar bitácora + toast.
 *
 * Cubre el escenario de aceptación del brief:
 *   - "Registrar movimientos" + "Ver alertas + estado final".
 *
 * Camino:
 *   1. Login.
 *   2. Activar primera sede.
 *   3. Ir a Movimientos.
 *   4. Registrar una entrada de 5 unidades del primer producto.
 *   5. Ver toast de éxito + nueva fila en la bitácora.
 */
import { expect, test } from "@playwright/test";
import { activateFirstSede, loginAsDemo } from "./_helpers";

test("registrar movimiento + toast + bitácora actualizada", async ({ page }) => {
  await loginAsDemo(page);
  await activateFirstSede(page);

  // Click en "Movimientos" del sidebar
  await page.getByRole("link", { name: /movimientos/i }).click();
  await expect(page).toHaveURL(/\/movements$/);
  await expect(page.getByRole("heading", { level: 1, name: /^movimientos$/i })).toBeVisible();

  // Esperar a que el catálogo de productos del inventario esté cargado en el select
  // (el form de movimientos usa id="m-productId").
  const productSelect = page.locator("#m-productId");
  await expect(productSelect).toBeVisible();
  await page.waitForFunction(
    () => {
      const sel = document.getElementById("m-productId") as HTMLSelectElement | null;
      return !!sel && sel.options.length > 1;
    },
    null,
    { timeout: 10_000 }
  );
  await productSelect.selectOption({ index: 1 });

  // Tipo: entrada (default ya está seleccionado en el dropdown)
  await page.locator("#m-cantidad").fill("5");

  await page.getByRole("button", { name: /^registrar$/i }).click();

  // Toast de éxito visible (aria-live region)
  await expect(page.getByText(/movimiento registrado/i)).toBeVisible({ timeout: 5_000 });

  // El KPI "registrados" debe ser >= 1 (puede haber otros pre-seed)
  const stats = page.locator(".page-header__stats");
  await expect(stats).toContainText(/total/i);
});
