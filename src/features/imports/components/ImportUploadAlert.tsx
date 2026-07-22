import { AppLink } from '../../../app/routing/router';
import { Alert } from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import {
  classifyImportUploadError,
  readExistingJobId,
} from '../hooks/import-errors';
import { formatFileSize } from '../utils/import-file';

type ImportUploadAlertProps = {
  error: ApiError;
  maxFileSizeBytes: number;
  onDismiss: () => void;
};

/**
 * Apresenta cada falha de envio conhecida com o tratamento próprio previsto
 * pelo contrato. Nenhum detalhe interno, payload ou stack trace é exibido: a
 * mensagem sempre vem do `ApiError` normalizado.
 */
export function ImportUploadAlert({
  error,
  maxFileSizeBytes,
  onDismiss,
}: ImportUploadAlertProps) {
  const issue = classifyImportUploadError(error);

  if (issue === 'already-processed') {
    const existingJobId = readExistingJobId(error);

    return (
      <Alert onDismiss={onDismiss} title="Este arquivo já foi importado" tone="info">
        <p>
          Nenhum registro foi duplicado. A importação anterior continua
          disponível no histórico.
        </p>
        {existingJobId ? (
          <AppLink
            className="button button--outline button--sm"
            to={`/imports/${existingJobId}`}
          >
            Ver importação
          </AppLink>
        ) : null}
      </Alert>
    );
  }

  if (issue === 'idempotency-mismatch') {
    return (
      <Alert
        onDismiss={onDismiss}
        title="Não foi possível reutilizar esta operação"
        tone="warning"
      >
        Esta operação já foi registrada para um arquivo diferente. O arquivo
        selecionado continua disponível: envie novamente para iniciar uma nova
        operação.
      </Alert>
    );
  }

  if (issue === 'file-too-large') {
    return (
      <Alert onDismiss={onDismiss} title="Arquivo acima do limite" tone="danger">
        {error.message} O limite considerado por esta interface é de{' '}
        {formatFileSize(maxFileSizeBytes)}.
      </Alert>
    );
  }

  if (issue === 'unsupported-type') {
    return (
      <Alert onDismiss={onDismiss} title="Formato não suportado" tone="danger">
        {error.message} Envie um arquivo CSV ou OFX.
      </Alert>
    );
  }

  if (issue === 'invalid-file') {
    return (
      <Alert
        onDismiss={onDismiss}
        title="O arquivo não pôde ser interpretado"
        tone="danger"
      >
        {error.message}
      </Alert>
    );
  }

  if (issue === 'forbidden') {
    return (
      <Alert onDismiss={onDismiss} title="Acesso não permitido" tone="danger">
        {error.message}
      </Alert>
    );
  }

  return (
    <Alert onDismiss={onDismiss} title="Não foi possível enviar o arquivo" tone="danger">
      {error.message}
    </Alert>
  );
}
