import type { FormEvent } from 'react';
import {
  Button,
  Card,
  Input,
  PasswordInput,
} from '../../../components/ui';
import { AppLink, navigate } from '../../../app/routing/router';
import { useLoginForm } from '../hooks/use-login-form';
import { AuthErrorAlert } from '../components/AuthErrorAlert';
import { AuthLayout } from '../components/AuthLayout';

export function LoginPage() {
  const form = useLoginForm();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (await form.submit()) {
      navigate('/');
    }
  }

  return (
    <AuthLayout>
      <Card as="section" className="auth-card">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">Boas-vindas</span>
          <h2>Acesse sua conta</h2>
          <p>Entre para continuar cuidando da sua vida financeira.</p>
        </header>

        {form.error ? <AuthErrorAlert error={form.error} /> : null}

        <form
          aria-label="Acesso à conta"
          className="auth-form"
          noValidate
          onSubmit={handleSubmit}
        >
          <Input
            autoComplete="username"
            autoFocus
            error={form.fieldErrors.username}
            label="E-mail ou usuário"
            name="username"
            onChange={(event) =>
              form.setValue('username', event.currentTarget.value)
            }
            placeholder="seu@email.com"
            required
            value={form.values.username}
          />
          <PasswordInput
            autoComplete="current-password"
            error={form.fieldErrors.password}
            label="Senha"
            name="password"
            onChange={(event) =>
              form.setValue('password', event.currentTarget.value)
            }
            required
            value={form.values.password}
          />
          <div className="auth-form__between">
            <span className="text-caption text-muted">
              Seus dados são enviados somente ao API Gateway.
            </span>
            <AppLink className="auth-link" to="/forgot-password">
              Esqueci minha senha
            </AppLink>
          </div>
          <Button
            fullWidth
            loading={form.isLoading}
            size="lg"
            type="submit"
          >
            Entrar
          </Button>
        </form>

        <p className="auth-card__footer">
          Ainda não tem uma conta?{' '}
          <AppLink className="auth-link" to="/register">
            Criar conta
          </AppLink>
        </p>
      </Card>
    </AuthLayout>
  );
}
