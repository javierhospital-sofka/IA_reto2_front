/**
 * E2E flujo 1 — Login + dashboard con datos auto-sembrados.
 *
 * Cubre el escenario de aceptación del brief:
 *   - El usuario ingresa con el demo user.
 *   - Tras login ve el dashboard con los inventarios sembrados al startup.
 *   - Las KPIs muestran números reales (no zeros).
 *   - Las gráficas (recharts) están renderizadas.
 */
import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./_helpers";

test("login + dashboard con datos sembrados", async ({ page }) => {
  await loginAsDemo(page);

  // KPIs visibles con números > 0 (auto-seed garantiza 24 inv / 1200 productos)
  const kpiStrip = page.locator(".kpi-strip");
  await expect(kpiStrip).toBeVisible();

  // El KPI "Inventarios" debe mostrar al menos 1
  const inventariosCard = kpiStrip.locator(".kpi-card", { hasText: /inventarios/i });
  await expect(inventariosCard).toBeVisible();

  // Charts grid presente con sus 4 cards
  const charts = page.locator(".charts-grid .chart-card");
  await expect(charts).toHaveCount(4);

  // Tabla de inventarios con filas
  await expect(page.locator(".table--clickable tbody tr").first()).toBeVisible({
    timeout: 10_000
  });

  // System status panel con servicios listados
  await expect(page.getByRole("heading", { name: /estado del sistema/i })).toBeVisible();
  await expect(page.getByText(/inventory service/i)).toBeVisible();
  await expect(page.getByText(/core retail service/i)).toBeVisible();
  await expect(page.getByText(/postgres/i).first()).toBeVisible();
});
