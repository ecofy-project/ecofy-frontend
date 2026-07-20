import type { FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  PasswordInput,
} from '../../../components/ui';
import {
  AppLink,
  useSearchParam,
} from '../../../app/routing/router';
import { AuthErrorAlert } from '../components/AuthErrorAlert';
import { AuthLayout } from '../components/AuthLayout';
import { useResetPasswordForm } from '../hooks/use-reset-password-form';

export function ResetPasswordPage() {
  const token = useSearchParam('token');
  const form = useResetPasswordForm(token);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <AuthLayout>
      <Card as="section" className="auth-card">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">Nova credencial</span>
          <h2>Redefina sua senha</h2>
          <p>Escolha uma nova senha para voltar a acessar sua conta.</p>
        </header>

        {!token ? (
          <Alert title="Link de redefinição incompleto" tone="warning">
            Abra o link recebido por e-mail ou solicite uma nova redefinição.
          </Alert>
        ) : null}

        {form.isComplete ? (
          <Alert title="Senha redefinida" tone="success">
            Sua nova senha foi registrada. Você já pode entrar.
          </Alert>
        ) : null}

        {form.error ? <AuthErrorAlert error={form.error} /> : null}

        {!form.isComplete ? (
          <form
            aria-label="Redefinição de senha"
            className="auth-form"
            noValidate
            onSubmit={handleSubmit}
          >
            <PasswordInput
              autoComplete="new-password"
              autoFocus={Boolean(token)}
              disabled={!token}
              error={form.fieldError}
              helperText="Use de 8 a 100 caracteres."
              label="Nova senha"
              maxLength={100}
              minLength={8}
              name="newPassword"
              onChange={(event) =>
                form.setNewPassword(event.currentTarget.value)
              }
              required
              value={form.newPassword}
            />
            <Button
              disabled={!token}
              fullWidth
              loading={form.isLoading}
              size="lg"
              type="submit"
            >
              Redefinir senha
            </Button>
          </form>
        ) : (
          <AppLink
            className="button button--primary button--lg button--full"
            to="/login"
          >
            Entrar com a nova senha
          </AppLink>
        )}

        {!token ? (
          <p className="auth-card__footer">
            <AppLink className="auth-link" to="/forgot-password">
              Solicitar um novo link
            </AppLink>
          </p>
        ) : null}
      </Card>
    </AuthLayout>
  );
}
