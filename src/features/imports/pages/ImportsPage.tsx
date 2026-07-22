import { useCallback, useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Pagination,
  useToast,
} from '../../../components/ui';
import { FileDropzone } from '../components/FileDropzone';
import { ImportHistoryCard } from '../components/ImportHistoryCard';
import { ImportHistoryTable } from '../components/ImportHistoryTable';
import { ImportProgress } from '../components/ImportProgress';
import {
  ImportErrorState,
  ImportHistorySkeleton,
} from '../components/ImportResourceState';
import { ImportResult } from '../components/ImportResult';
import { ImportStatusFilter } from '../components/ImportStatusFilter';
import { ImportUploadAlert } from '../components/ImportUploadAlert';
import { SelectedFileCard } from '../components/SelectedFileCard';
import { useImportHistory } from '../hooks/use-import-history';
import { useImportUpload } from '../hooks/use-import-upload';
import { validateImportFile } from '../utils/import-file';

/**
 * Envio de arquivo e histórico. A página não conhece o modo de execução, não
 * monta requisições e não interpreta o conteúdo do arquivo.
 */
export function ImportsPage() {
  const history = useImportHistory();
  const { reload: reloadHistory } = history;
  const onUploadFinished = useCallback(() => reloadHistory(), [reloadHistory]);
  const upload = useImportUpload(onUploadFinished);
  const { showToast } = useToast();
  const [selectionError, setSelectionError] = useState('');

  const { maxFileSizeBytes, selectFile } = upload;

  const handleSelect = useCallback(
    (files: readonly File[]) => {
      if (files.length === 0) {
        return;
      }

      const rejection = validateImportFile(files, maxFileSizeBytes);

      if (rejection) {
        setSelectionError(rejection.message);
        selectFile(null);
        return;
      }

      setSelectionError('');
      selectFile(files[0] ?? null);
    },
    [maxFileSizeBytes, selectFile],
  );

  async function handleSubmit() {
    const result = await upload.startUpload();

    if (result.ok) {
      showToast({
        title: 'Arquivo enviado',
        message: 'Acompanhe o processamento nesta página.',
        tone: 'success',
      });
    }
  }

  function handleRemove() {
    setSelectionError('');
    upload.reset();
  }

  const page = history.jobs;
  const isTerminal =
    upload.state === 'completed' ||
    upload.state === 'completed_with_errors' ||
    upload.state === 'failed';

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">ENTRADA DE DADOS</span>
          <h1>Importações</h1>
          <p>
            Envie um extrato em CSV ou OFX e acompanhe o processamento feito
            pelo serviço de ingestão.
          </p>
        </div>
      </header>

      <section aria-labelledby="import-upload-heading" className="import-upload">
        <h2 className="sr-only" id="import-upload-heading">
          Enviar arquivo
        </h2>

        {upload.error ? (
          <ImportUploadAlert
            error={upload.error}
            maxFileSizeBytes={upload.maxFileSizeBytes}
            onDismiss={upload.clearError}
          />
        ) : null}

        {isTerminal && upload.job ? (
          <ImportResult
            errors={upload.errors}
            job={upload.job}
            onStartNew={handleRemove}
          />
        ) : (
          <>
            <FileDropzone
              disabled={upload.isUploading}
              error={selectionError}
              maxFileSizeBytes={upload.maxFileSizeBytes}
              onSelect={handleSelect}
            />

            {upload.selectedFile ? (
              <SelectedFileCard
                canSubmit={!upload.isUploading && upload.state === 'selected'}
                file={upload.selectedFile}
                isUploading={upload.isUploading}
                onRemove={handleRemove}
                onSubmit={handleSubmit}
              />
            ) : null}

            <ImportProgress
              isUploading={upload.isUploading}
              job={upload.job}
              onCancel={upload.cancelUpload}
              uploadPercent={upload.uploadPercent}
            />

            {upload.pollingExhausted ? (
              <p className="import-note" role="status">
                O processamento continua em andamento no serviço. Consulte os
                detalhes desta importação mais tarde.
              </p>
            ) : null}
          </>
        )}
      </section>

      <section aria-labelledby="import-history-heading" className="import-history">
        <div className="demo-section-heading">
          <div>
            <span className="demo-eyebrow">HISTÓRICO</span>
            <h2 id="import-history-heading">Importações anteriores</h2>
          </div>
          <div className="import-history__filters">
            <ImportStatusFilter
              disabled={history.isLoading}
              onChange={history.changeStatus}
              status={history.status}
            />
          </div>
        </div>

        <p aria-live="polite" className="import-history__status">
          {history.isRefreshing || upload.isPolling
            ? 'Atualizando informações...'
            : ''}
        </p>

        {history.isLoading ? (
          <ImportHistorySkeleton />
        ) : history.error ? (
          <ImportErrorState error={history.error} onRetry={history.reload} />
        ) : !page || page.content.length === 0 ? (
          <Card as="section" className="import-state-card">
            <EmptyState
              description={
                history.status
                  ? 'Nenhuma importação corresponde ao status selecionado.'
                  : 'Envie um arquivo CSV ou OFX para começar.'
              }
              title="Nenhuma importação encontrada"
              {...(history.status
                ? {
                    actionLabel: 'Limpar filtro',
                    onAction: () => history.changeStatus(undefined),
                  }
                : {})}
            />
          </Card>
        ) : (
          <div
            className={`import-history__results ${
              history.isRefreshing ? 'import-history__results--updating' : ''
            }`.trim()}
          >
            <ImportHistoryTable jobs={page.content} />
            <div className="import-history__cards">
              {page.content.map((job) => (
                <ImportHistoryCard job={job} key={job.id} />
              ))}
            </div>
            <Pagination
              onPageChange={history.changePage}
              page={page.page}
              totalElements={page.totalElements}
              totalPages={page.totalPages}
            />
          </div>
        )}

        <div className="import-history__actions">
          <Button onClick={history.reload} size="sm" variant="ghost">
            Atualizar histórico
          </Button>
        </div>
      </section>
    </div>
  );
}
