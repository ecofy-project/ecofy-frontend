import { useRef, useState, type ChangeEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ProgressBar,
  StatusBadge,
  useToast,
} from '../../../components/ui';
import type { BadgeTone } from '../../../components/ui';
import { useImports } from '../../demo/hooks/use-demo-data';
import type { DemoImportStatus } from '../../demo/types/demo';
import { formatDemoDate } from '../../demo/utils/demo-format';

function importStatus(status: DemoImportStatus): {
  label: string;
  tone: BadgeTone;
} {
  const statuses: Record<
    DemoImportStatus,
    { label: string; tone: BadgeTone }
  > = {
    PENDING: { label: 'Selecionado', tone: 'neutral' },
    RUNNING: { label: 'Processando', tone: 'processing' },
    COMPLETED: { label: 'Concluído', tone: 'success' },
    COMPLETED_WITH_ERRORS: { label: 'Concluído com erros', tone: 'warning' },
    FAILED: { label: 'Falhou', tone: 'danger' },
  };
  return statuses[status];
}

export function ImportsPage() {
  const imports = useImports();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectionError, setSelectionError] = useState('');

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setSelectionError('');

    if (file && file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      setSelectionError('Escolha um arquivo de até 5 MB para a demonstração.');
      return;
    }

    setSelectedFile(file);
  }

  async function handleImport() {
    if (!selectedFile) {
      setSelectionError('Selecione um arquivo CSV ou OFX.');
      return;
    }

    const result = await imports.startImport({
      name: selectedFile.name,
      size: selectedFile.size,
    });

    if (result.ok) {
      setSelectedFile(null);
      showToast({
        title: 'Importação concluída',
        message: 'O resultado demonstrativo está disponível no histórico.',
        tone: 'success',
      });
    }
  }

  if (imports.isLoading) {
    return <LoadingState label="Carregando importações" />;
  }

  if (imports.error && !imports.data) {
    return (
      <ErrorState
        actionLabel="Tentar novamente"
        description={imports.error.message}
        onAction={imports.reload}
      />
    );
  }

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">ENTRADA DE DADOS</span>
          <h1>Importações</h1>
          <p>Experimente o fluxo de envio sem expor ou processar dados financeiros.</p>
        </div>
      </header>

      <Card as="section" className="import-dropzone">
        <span className="import-dropzone__icon">
          <Icon name="imports" size={24} />
        </span>
        <div>
          <h2>Selecione um arquivo demonstrativo</h2>
          <p>CSV ou OFX, até 5 MB. O conteúdo não será lido nem armazenado.</p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          Escolher arquivo
        </Button>
        <input
          accept=".csv,.ofx,text/csv,application/x-ofx"
          hidden
          id="demo-import-file"
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
        {selectedFile ? (
          <div className="import-selection" role="status">
            <span>
              <strong>{selectedFile.name}</strong>
              <small>{Math.max(1, Math.round(selectedFile.size / 1024))} KB selecionados</small>
            </span>
            <Button
              loading={imports.isSaving}
              onClick={handleImport}
              size="sm"
            >
              Simular importação
            </Button>
          </div>
        ) : null}
        {selectionError ? (
          <Alert title="Arquivo não selecionado" tone="danger">
            {selectionError}
          </Alert>
        ) : null}
        {imports.progress ? (
          <div className="import-progress" role="status">
            <div>
              <strong>
                {imports.progress.phase === 'uploading'
                  ? 'Enviando arquivo…'
                  : 'Processando dados…'}
              </strong>
              <span className="numeric">{imports.progress.percent}%</span>
            </div>
            <ProgressBar
              label={`Importação em ${imports.progress.percent}%`}
              tone="processing"
              value={imports.progress.percent}
            />
          </div>
        ) : null}
      </Card>

      <section aria-labelledby="import-history-heading" className="demo-section">
        <div className="demo-section-heading">
          <div>
            <span className="demo-eyebrow">HISTÓRICO</span>
            <h2 id="import-history-heading">Importações recentes</h2>
          </div>
        </div>
        {!imports.data?.length ? (
          <Card>
            <EmptyState
              description="Selecione um arquivo para iniciar a primeira simulação."
              title="Nenhuma importação"
            />
          </Card>
        ) : (
          <div className="import-history">
            {imports.data.map((item) => {
              const status = importStatus(item.status);
              return (
                <Card as="article" className="import-card" key={item.id}>
                  <div className="import-card__heading">
                    <div>
                      <h3>{item.fileName}</h3>
                      <time dateTime={item.createdAt}>{formatDemoDate(item.createdAt)}</time>
                    </div>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </div>
                  {item.result ? (
                    <dl className="import-result">
                      <div><dt>Total</dt><dd>{item.result.totalRecords}</dd></div>
                      <div><dt>Processados</dt><dd>{item.result.processedRecords}</dd></div>
                      <div><dt>Sucesso</dt><dd>{item.result.successCount}</dd></div>
                      <div><dt>Erros</dt><dd>{item.result.errorCount}</dd></div>
                      <div><dt>Duplicados</dt><dd>{item.result.duplicateRecords}</dd></div>
                      <div><dt>Publicados</dt><dd>{item.result.publishedRecords}</dd></div>
                    </dl>
                  ) : null}
                  {item.result?.errors.length ? (
                    <ul className="import-errors">
                      {item.result.errors.map((error) => (
                        <li key={`${item.id}-${error.line}`}>
                          <strong>Linha {error.line}</strong>
                          <span>{error.message}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
