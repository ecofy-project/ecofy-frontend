import { Button, Card } from '../../../components/ui';
import { formatFileSize, readFileExtension } from '../utils/import-file';

type SelectedFileCardProps = {
  file: File;
  isUploading: boolean;
  canSubmit: boolean;
  onRemove: () => void;
  onSubmit: () => void;
};

/**
 * Metadados do arquivo escolhido. Nome, extensão e tamanho vêm da referência do
 * navegador — o conteúdo não é lido em nenhum momento.
 */
export function SelectedFileCard({
  canSubmit,
  file,
  isUploading,
  onRemove,
  onSubmit,
}: SelectedFileCardProps) {
  const extension = readFileExtension(file.name).replace('.', '').toUpperCase();

  return (
    <Card as="section" className="import-selected-file">
      <div className="import-selected-file__identity">
        <span className="import-eyebrow">{extension || 'ARQUIVO'}</span>
        <p className="import-selected-file__name">{file.name}</p>
        <p className="import-selected-file__size numeric">
          {formatFileSize(file.size)}
        </p>
      </div>
      <div className="import-selected-file__actions">
        <Button disabled={isUploading} onClick={onRemove} variant="ghost">
          Remover
        </Button>
        <Button disabled={!canSubmit} loading={isUploading} onClick={onSubmit}>
          Enviar arquivo
        </Button>
      </div>
    </Card>
  );
}
