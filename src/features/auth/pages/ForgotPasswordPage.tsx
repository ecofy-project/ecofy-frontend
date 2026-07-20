import type { FormEvent } from 'react';
import { Alert, Button, Card, Input } from '../../../components/ui';
import { AppLink } from '../../../app/routing/router';
import { AuthErrorAlert } from '../components/AuthErrorAlert';
import { AuthLayout } from '../components/AuthLayout';
import { useForgotPasswordForm } from '../hooks/use-forgot-password-form';

export function ForgotPasswordPage() {
  const form = useForgotPasswordForm();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <AuthLayout>
      <Card as="section" className="auth-card">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">Recuperação de acesso</span>
          <h2>Esqueceu sua senha?</h2>
          <p>
            Informe seu e-mail para receber as instruções de redefinição.
          </p>
        </header>

        {form.isComplete ? (
          <Alert title="Verifique seu e-mail" tone="success">
            Se houver uma conta associada, as instruções serão enviadas. Essa
            confirmação não revela se o endereço está cadastrado.
          </Alert>
        ) : null}

        {form.error ? <AuthErrorAlert error={form.error} /> : null}

        <form
          aria-label="Solicitação de redefinição de senha"
          className="auth-form"
          noValidate
          onSubmit={handleSubmit}
        >
          <Input
            autoComplete="email"
            autoFocus
            error={form.fieldError}
            inputMode="email"
            label="E-mail"
            name="email"
            onChange={(event) => form.setEmail(event.currentTarget.value)}
            required
            type="email"
            value={form.email}
          />
          <Button
            fullWidth
            loading={form.isLoading}
            size="lg"
            type="submit"
          >
            Continuar
          </Button>
        </form>

        <p className="auth-card__footer">
          Lembrou sua senha?{' '}
          <AppLink className="auth-link" to="/login">
            Voltar para o acesso
          </AppLink>
        </p>
      </Card>
    </AuthLayout>
  );
}
