import type { FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  PasswordInput,
} from '../../../components/ui';
import { AppLink } from '../../../app/routing/router';
import { AuthErrorAlert } from '../components/AuthErrorAlert';
import { AuthLayout } from '../components/AuthLayout';
import { useRegisterForm } from '../hooks/use-register-form';

export function RegisterPage() {
  const form = useRegisterForm();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <AuthLayout>
      <Card as="section" className="auth-card auth-card--wide">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">Primeiro passo</span>
          <h2>Crie sua conta</h2>
          <p>Preencha seus dados para começar com uma base organizada.</p>
        </header>

        {form.isComplete ? (
          <Alert title="Cadastro enviado com sucesso" tone="success">
            Consulte seu e-mail para continuar pelo link de confirmação.
          </Alert>
        ) : null}

        {form.error ? <AuthErrorAlert error={form.error} /> : null}

        {!form.isComplete ? (
          <form
            aria-label="Criação de conta"
            className="auth-form auth-form--register"
            noValidate
            onSubmit={handleSubmit}
          >
            <Input
              autoComplete="given-name"
              autoFocus
              error={form.fieldErrors.firstName}
              label="Nome"
              name="firstName"
              onChange={(event) =>
                form.setValue('firstName', event.currentTarget.value)
              }
              required
              value={form.values.firstName}
            />
            <Input
              autoComplete="family-name"
              error={form.fieldErrors.lastName}
              label="Sobrenome"
              name="lastName"
              onChange={(event) =>
                form.setValue('lastName', event.currentTarget.value)
              }
              required
              value={form.values.lastName}
            />
            <div className="auth-form__full">
              <Input
                autoComplete="email"
                error={form.fieldErrors.email}
                inputMode="email"
                label="E-mail"
                name="email"
                onChange={(event) =>
                  form.setValue('email', event.currentTarget.value)
                }
                required
                type="email"
                value={form.values.email}
              />
            </div>
            <div className="auth-form__full">
              <PasswordInput
                autoComplete="new-password"
                error={form.fieldErrors.password}
                helperText="Use de 8 a 100 caracteres."
                label="Senha"
                maxLength={100}
                minLength={8}
                name="password"
                onChange={(event) =>
                  form.setValue('password', event.currentTarget.value)
                }
                required
                value={form.values.password}
              />
            </div>
            <div className="auth-form__full">
              <Button
                fullWidth
                loading={form.isLoading}
                size="lg"
                type="submit"
              >
                Criar conta
              </Button>
            </div>
          </form>
        ) : (
          <AppLink
            className="button button--outline button--lg button--full"
            to="/confirm-email"
          >
            Ver como confirmar o e-mail
          </AppLink>
        )}

        <p className="auth-card__footer">
          Já tem uma conta?{' '}
          <AppLink className="auth-link" to="/login">
            Entrar
          </AppLink>
        </p>
      </Card>
    </AuthLayout>
  );
}
