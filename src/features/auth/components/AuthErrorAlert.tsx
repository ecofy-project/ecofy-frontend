import { Alert } from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';

export function AuthErrorAlert({ error }: { error: ApiError }) {
  return (
    <Alert title={error.message} tone="danger">
      {error.traceId ? (
        <span className="numeric">Referência: {error.traceId}</span>
      ) : null}
    </Alert>
  );
}
