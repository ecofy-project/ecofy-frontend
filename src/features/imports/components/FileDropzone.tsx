import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { Icon } from '../../../components/ui';
import { formatFileSize, importFileAccept } from '../utils/import-file';

type FileDropzoneProps = {
  maxFileSizeBytes: number;
  disabled?: boolean;
  error?: string;
  onSelect: (files: readonly File[]) => void;
};

/**
 * Área de envio acessível por clique, teclado e arrastar-e-soltar. O conteúdo
 * do arquivo nunca é lido: apenas a referência selecionada é repassada.
 */
export function FileDropzone({
  disabled = false,
  error,
  maxFileSizeBytes,
  onSelect,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function openFilePicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.currentTarget.files ?? [])];
    /* Permite reenviar o mesmo arquivo depois de removê-lo. */
    event.currentTarget.value = '';
    onSelect(files);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);

    if (disabled) {
      return;
    }

    onSelect([...event.dataTransfer.files]);
  }

  return (
    <div className="import-dropzone-wrap">
      <div
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
        aria-disabled={disabled || undefined}
        aria-label="Área de envio de arquivo. Arraste um arquivo ou pressione Enter para escolher."
        className={`import-dropzone-area ${
          isDraggingOver ? 'import-dropzone-area--active' : ''
        } ${error ? 'import-dropzone-area--error' : ''}`.trim()}
        onClick={openFilePicker}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <span aria-hidden="true" className="import-dropzone-area__icon">
          <Icon name="imports" size={24} />
        </span>
        <p className="import-dropzone-area__title">Arraste seu arquivo aqui</p>
        <p className="import-dropzone-area__hint">ou</p>
        <span className="import-dropzone-area__action">Selecionar arquivo</span>
        <p className="import-dropzone-area__meta" id={descriptionId}>
          Formatos aceitos: CSV ou OFX, até {formatFileSize(maxFileSizeBytes)}.
          O conteúdo do arquivo não é lido nem armazenado pela interface.
        </p>
      </div>

      <label className="sr-only" htmlFor={inputId}>
        Arquivo de importação
      </label>
      <input
        accept={importFileAccept}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      {error ? (
        <p className="import-dropzone-wrap__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
