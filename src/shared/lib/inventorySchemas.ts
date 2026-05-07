/**
 * Zod schemas mirrored from the backend api-contracts.
 *
 * Why mirror instead of import? The frontend is a separate package with its
 * own version lifecycle. Having a thin local copy keeps the dependency graph
 * simple while still validating user input before it hits the wire.
 *
 * Whenever the backend `retailContracts.ts` schemas change, the changes must
 * be reflected here too — covered by integration tests + the Postman
 * collection that lives in this repo.
 */

import { z } from 'zod';

export const movimientoTipoSchema = z.union([
  z.literal('entrada'),
  z.literal('salida'),
  z.literal('ajuste'),
  z.literal('reserva'),
  z.literal('liberacion')
]);

export const createInventoryFormSchema = z.object({
  storeId: z.string().min(1, 'Selecciona una tienda')
});

export const productFormSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  stockInicial: z
    .union([
      z.coerce.number().int().nonnegative('No puede ser negativo'),
      z.literal('').transform(() => null)
    ])
    .nullable()
    .optional(),
  stockMinimo: z
    .union([
      z.coerce.number().int().nonnegative('No puede ser negativo'),
      z.literal('').transform(() => null)
    ])
    .nullable()
    .optional(),
  stockMaximo: z
    .union([
      z.coerce.number().int().nonnegative('No puede ser negativo'),
      z.literal('').transform(() => null)
    ])
    .nullable()
    .optional(),
  leadTimeReposicion: z
    .union([
      z.coerce.number().int().nonnegative('No puede ser negativo'),
      z.literal('').transform(() => null)
    ])
    .nullable()
    .optional()
});

export const movementFormSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  tipoMovimiento: movimientoTipoSchema,
  cantidad: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .int('Debe ser entero')
    .positive('Debe ser mayor a cero'),
  origen: z.string().trim().min(1, 'Indica el origen'),
  destino: z.string().trim().min(1, 'Indica el destino')
});

export const editMovementFormSchema = movementFormSchema.partial().extend({
  expectedVersion: z.coerce.number().int().positive()
});

export type CreateInventoryFormValues = z.infer<typeof createInventoryFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type MovementFormValues = z.infer<typeof movementFormSchema>;
export type EditMovementFormValues = z.infer<typeof editMovementFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, 'Email requerido').email('Email no válido'),
  password: z.string().min(4, 'Mínimo 4 caracteres')
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
