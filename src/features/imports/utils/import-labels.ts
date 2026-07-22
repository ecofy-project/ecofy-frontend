import type { BadgeTone } from '../../../components/ui';
import type {
  ImportErrorType,
  ImportJobStatus,
} from '../types/import';

/** Rótulos e tons de apresentação para os status confirmados pelo domínio. */

const statusLabels: Record<ImportJobStatus, string> = {
  PENDING: 'Aguardando',
  RUNNING: 'Processando',
  COMPLETED: 'Concluída',
  COMPLETED_WITH_ERRORS: 'Concluída com inconsistências',
  FAILED: 'Falhou',
};

const statusTones: Record<ImportJobStatus, BadgeTone> = {
  PENDING: 'neutral',
  RUNNING: 'processing',
  COMPLETED: 'success',
  COMPLETED_WITH_ERRORS: 'warning',
  FAILED: 'danger',
};

const statusDescriptions: Record<ImportJobStatus, string> = {
  PENDING: 'Aguardando processamento.',
  RUNNING: 'Processando arquivo.',
  COMPLETED: 'Importação concluída.',
  COMPLETED_WITH_ERRORS: 'Importação concluída com algumas inconsistências.',
  FAILED: 'A importação não pôde ser concluída.',
};

const errorTypeLabels: Record<ImportErrorType, string> = {
  PARSE_ERROR: 'Leitura',
  VALIDATION_ERROR: 'Validação',
  STORAGE_ERROR: 'Armazenamento',
  UNKNOWN: 'Não classificado',
};

export function importStatusLabel(status: ImportJobStatus): string {
  return statusLabels[status];
}

export function importStatusTone(status: ImportJobStatus): BadgeTone {
  return statusTones[status];
}

export function importStatusDescription(status: ImportJobStatus): string {
  return statusDescriptions[status];
}

export function importErrorTypeLabel(errorType?: ImportErrorType): string {
  return errorType ? errorTypeLabels[errorType] : 'Não classificado';
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Formata os `Instant` do contrato, que chegam em UTC. Valores ausentes ou
 * inválidos nunca produzem "Invalid Date".
 */
export function formatImportDateTime(value?: string): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateTimeFormatter.format(parsed);
}
