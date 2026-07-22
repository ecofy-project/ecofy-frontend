import {
  importFileTypes,
  type ImportFileType,
} from '../types/import';

/**
 * Validações preliminares de arquivo.
 *
 * Servem apenas para UX: extensão, tamanho e quantidade. O backend continua
 * sendo a autoridade final sobre MIME type, encoding, cabeçalho e estrutura.
 * Nenhum conteúdo do arquivo é lido aqui.
 */

/** Extensões suportadas pelo `ImportFileType` do serviço. */
export const supportedImportExtensions = ['.csv', '.ofx'] as const;

/** Valor do atributo `accept`, que é apenas uma sugestão ao seletor nativo. */
export const importFileAccept = '.csv,.ofx,text/csv,application/x-ofx';

export type ImportFileRejection = Readonly<{
  reason: 'extension' | 'size' | 'count';
  message: string;
}>;

export function readFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex < 0 ? '' : fileName.slice(dotIndex).toLowerCase();
}

/**
 * Mapper central de tipo. O serviço infere o tipo pelo sufixo quando `type` não
 * é enviado; aqui a inferência acontece uma única vez, sem qualquer parsing.
 */
export function resolveImportFileType(
  fileName: string,
): ImportFileType | undefined {
  const extension = readFileExtension(fileName);

  if (extension === '.csv') {
    return importFileTypes[0];
  }

  return extension === '.ofx' ? importFileTypes[1] : undefined;
}

export function formatFileSize(bytes: number, locale = 'pt-BR'): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 10 || unitIndex === 0 ? 0 : 1,
  }).format(value);

  return `${formatted} ${units[unitIndex]}`;
}

/**
 * Não confia apenas no atributo `accept`: a extensão é conferida pelo nome do
 * arquivo antes de qualquer envio.
 */
export function validateImportFile(
  files: readonly File[],
  maxFileSizeBytes: number,
): ImportFileRejection | null {
  if (files.length > 1) {
    return {
      reason: 'count',
      message: 'Envie um arquivo por vez.',
    };
  }

  const file = files[0];

  if (!file) {
    return {
      reason: 'count',
      message: 'Selecione um arquivo CSV ou OFX.',
    };
  }

  if (!resolveImportFileType(file.name)) {
    return {
      reason: 'extension',
      message: 'Formato não suportado. Envie um arquivo .csv ou .ofx.',
    };
  }

  if (file.size > maxFileSizeBytes) {
    return {
      reason: 'size',
      message: `O arquivo excede o limite de ${formatFileSize(maxFileSizeBytes)}.`,
    };
  }

  return null;
}
