/**
 * Visual stepper for the inventory workflow.
 *
 * Reflects the brief acceptance scenario:
 *   1. Crear / abrir inventario
 *   2. Registrar productos
 *   3. Registrar movimientos
 *   4. Optimizar
 *   5. Revisar alertas
 *
 * The stepper is informational, not a navigation guard. It announces
 * "step X of N" via aria-current and lets the user jump between steps.
 */

import type { JSX } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';

export type InventoryStepKey =
  | 'inventario'
  | 'products'
  | 'movements'
  | 'optimization'
  | 'alerts';

export interface InventoryStep {
  key: InventoryStepKey;
  title: string;
  description: string;
  done?: boolean;
}

interface StepperProps {
  steps: InventoryStep[];
  inventoryId: string | null;
}

const STEP_LABELS: Record<InventoryStepKey, { title: string; description: string }> = {
  inventario: { title: 'Abrir inventario', description: 'Selecciona la tienda' },
  products: { title: 'Registrar productos', description: 'Catálogo + stock inicial' },
  movements: { title: 'Movimientos', description: 'Entradas, salidas y ajustes' },
  optimization: { title: 'Optimizar', description: 'Sugerencias de reposición' },
  alerts: { title: 'Alertas', description: 'Revisar bajo stock / sobrestock' }
};

function pathForStep(step: InventoryStepKey, inventoryId: string | null): string {
  if (step === 'inventario') return '/inventario';
  if (!inventoryId) return '/inventario';
  return `/inventories/${inventoryId}/${step}`;
}

function isStepActive(pathname: string, step: InventoryStepKey): boolean {
  if (step === 'inventario') {
    return pathname === '/inventario' || pathname === '/';
  }
  return pathname.endsWith(`/${step}`);
}

export function InventoryStepper({ steps, inventoryId }: StepperProps): JSX.Element {
  const { pathname } = useLocation();
  return (
    <nav className="stepper" aria-label="Flujo de inventario">
      <ol>
        {steps.map((step, index) => {
          const labels = STEP_LABELS[step.key];
          const active = isStepActive(pathname, step.key);
          const target = pathForStep(step.key, inventoryId);
          const linkable = inventoryId !== null || step.key === 'inventario';
          return (
            <li
              key={step.key}
              className={`stepper__item ${active ? 'stepper__item--active' : ''} ${
                step.done ? 'stepper__item--done' : ''
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {linkable ? (
                <Link to={target} className="stepper__link">
                  <StepBadge index={index + 1} done={step.done} />
                  <StepText title={labels.title} description={labels.description} />
                </Link>
              ) : (
                <span className="stepper__link stepper__link--disabled" aria-disabled="true">
                  <StepBadge index={index + 1} done={step.done} />
                  <StepText title={labels.title} description={labels.description} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepBadge({ index, done }: { index: number; done?: boolean }): JSX.Element {
  return (
    <span className="stepper__badge" aria-hidden>
      {done ? <Check size={14} /> : index}
    </span>
  );
}

function StepText({
  title,
  description
}: {
  title: string;
  description: string;
}): JSX.Element {
  return (
    <span className="stepper__text">
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
  );
}
