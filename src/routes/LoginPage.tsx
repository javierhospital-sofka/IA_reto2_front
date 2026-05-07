/**
 * Login page using RHF + Zod for input validation. Auth itself is delegated
 * to AuthProvider which already wraps fetch + token storage.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boxes, Loader2 } from 'lucide-react';
import { useAuth } from '../features/auth/AuthProvider';
import { loginFormSchema, type LoginFormValues } from '../shared/lib/inventorySchemas';
import { useToast } from '../shared/components/ui/Toast';
import { getApiErrorMessage } from '../shared/lib/getApiErrorMessage';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: 'admin.retail@sofka.local',
      password: 'RetailDemo2026!'
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from ?? '/inventario';
      navigate(from, { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message.title, message.description ?? 'Credenciales inválidas o servicio no disponible.');
    }
  });

  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <div className="auth-page">
      <form className="auth-panel" onSubmit={onSubmit} noValidate>
        <Boxes color="#0f766e" size={34} aria-hidden />
        <p className="eyebrow">Retail IA Center</p>
        <h1>Gestión de inventario</h1>
        <p>Ingresa con el usuario demo local para operar inventarios, movimientos y optimización.</p>
        <div className="grid">
          <label htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              autoComplete="username"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              {...form.register('email')}
            />
            {emailError ? (
              <small id="email-error" className="field-error" role="alert">
                {emailError}
              </small>
            ) : null}
          </label>
          <label htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              {...form.register('password')}
            />
            {passwordError ? (
              <small id="password-error" className="field-error" role="alert">
                {passwordError}
              </small>
            ) : null}
          </label>
          <button className="button" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" aria-hidden /> Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
