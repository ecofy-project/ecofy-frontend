import { Alert, Button, Card } from '../../../components/ui';
import {
  AppLink,
  useSearchParam,
} from '../../../app/routing/router';
import { AuthErrorAlert } from '../components/AuthErrorAlert';
import { AuthLayout } from '../components/AuthLayout';
import { useConfirmEmail } from '../hooks/use-confirm-email';

export function ConfirmEmailPage() {
  const token = useSearchParam('token');
  const confirmation = useConfirmEmail(token);

  return (
    <AuthLayout>
      <Card as="section" className="auth-card auth-card--pending">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">Validação de cadastro</span>
          <h2>Confirme seu e-mail</h2>
          <p>
            A confirmação ativa o endereço associado ao link recebido.
          </p>
        </header>

        {!token ? (
          <Alert title="Aguardando o link de confirmação" tone="info">
            Abra o link enviado pelo EcoFy. Nenhum token precisa ser digitado
            nesta tela.
          </Alert>
        ) : null}

        {confirmation.isComplete ? (
          <Alert title="E-mail confirmado" tone="success">
            Seu endereço foi validado. Agora você já pode entrar.
          </Alert>
        ) : null}

        {confirmation.error ? (
          <AuthErrorAlert error={confirmation.error} />
        ) : null}

        {token && !confirmation.isComplete ? (
          <Button
            fullWidth
            loading={confirmation.isLoading}
            onClick={() => void confirmation.submit()}
            size="lg"
          >
            Confirmar e-mail
          </Button>
        ) : (
          <AppLink
            className="button button--outline button--lg button--full"
            to="/login"
          >
            Voltar para o acesso
          </AppLink>
        )}
      </Card>
    </AuthLayout>
  );
}
