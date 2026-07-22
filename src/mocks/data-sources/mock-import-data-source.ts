import type { ImportDataSource } from '../../features/imports/data-sources/import-data-source';
import { attachExistingJobId } from '../../features/imports/data-sources/import-mappers';
import type {
  ImportError,
  ImportJob,
  ImportJobDetails,
  ImportJobListParams,
  ImportJobPage,
  ImportJobStatus,
  ImportUploadInput,
  ImportUploadOptions,
} from '../../features/imports/types/import';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoImportJobError } from '../demo/demo-seed';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockImportOptions = Readonly<{
  scenario: MockScenario;
  delayMs: number;
}>;

/** Passos da simulação de envio, centralizados em um único lugar. */
const uploadProgressSteps = [0, 35, 70, 100] as const;

/** Job já existente usado pelo cenário de arquivo duplicado. */
const alreadyProcessedJobId = 'import-job-completed';

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  return `${prefix}-${randomId}`;
}

type MockUploadOutcome = Readonly<{
  status: ImportJobStatus;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: readonly Omit<ImportError, 'id'>[];
}>;

/**
 * Resultados prontos por cenário. São dados de seed, não cálculo: o Mock nunca
 * lê nem interpreta o arquivo enviado.
 */
const uploadOutcomes: Record<string, MockUploadOutcome> = {
  completed: {
    status: 'COMPLETED',
    totalRecords: 148,
    processedRecords: 148,
    successCount: 148,
    errorCount: 0,
    errors: [],
  },
  completedWithErrors: {
    status: 'COMPLETED_WITH_ERRORS',
    totalRecords: 148,
    processedRecords: 148,
    successCount: 145,
    errorCount: 3,
    errors: [
      { lineNumber: 24, errorType: 'PARSE_ERROR', message: 'Data em formato não reconhecido.' },
      { lineNumber: 78, errorType: 'VALIDATION_ERROR', message: 'Valor da movimentação ausente.' },
      { lineNumber: 116, errorType: 'VALIDATION_ERROR', message: 'Descrição excede o tamanho permitido.' },
    ],
  },
  failed: {
    status: 'FAILED',
    totalRecords: 0,
    processedRecords: 0,
    successCount: 0,
    errorCount: 1,
    errors: [
      {
        errorType: 'PARSE_ERROR',
        message: 'O cabeçalho do arquivo não pôde ser interpretado.',
      },
    ],
  },
  pending: {
    status: 'PENDING',
    totalRecords: 0,
    processedRecords: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  },
  running: {
    status: 'RUNNING',
    totalRecords: 148,
    processedRecords: 96,
    successCount: 94,
    errorCount: 2,
    errors: [],
  },
};

/**
 * Transições determinísticas usadas durante o polling. Cada consulta avança um
 * passo; não há aleatoriedade e a demonstração pública nunca falha sozinha.
 */
const pollingTransitions: Record<string, readonly MockUploadOutcome[]> = {
  'import-pending': [uploadOutcomes.running!, uploadOutcomes.completed!],
  'import-running': [uploadOutcomes.completed!],
};

function abortedError() {
  return new ApiErrorException({
    code: 'REQUEST_ABORTED',
    message: 'A solicitação foi cancelada.',
  });
}

/**
 * Mock Mode da ingestão.
 *
 * O arquivo selecionado funciona apenas como gatilho visual: nome, tamanho e
 * conteúdo não são lidos, transferidos nem persistidos. Apenas metadados
 * demonstrativos do job entram no Mock Storage central.
 */
export class MockImportDataSource implements ImportDataSource {
  /** Contador de consultas por job, para transições determinísticas. */
  private readonly pollCounts = new Map<string, number>();

  constructor(
    private readonly store: DemoStore,
    private readonly options: MockImportOptions,
  ) {}

  private async prepare() {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;
    await simulateMockLatency(delay);

    if (
      this.options.scenario === 'error' ||
      this.options.scenario === 'import-error'
    ) {
      throw new ApiErrorException({
        code: 'INGESTION_UNAVAILABLE',
        message: 'Não foi possível carregar as importações.',
        status: 503,
      });
    }
  }

  private rejectUploadWhenScenarioRequires() {
    switch (this.options.scenario) {
      case 'import-file-too-large':
        throw new ApiErrorException({
          code: 'FILE_SIZE_LIMIT_EXCEEDED',
          message: 'O arquivo excede o tamanho máximo permitido.',
          status: 413,
        });
      case 'import-unsupported-type':
        throw new ApiErrorException({
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'O tipo de arquivo enviado não é suportado.',
          status: 415,
        });
      case 'import-invalid-header':
        throw new ApiErrorException({
          code: 'INVALID_FILE_HEADER',
          message: 'O cabeçalho do arquivo não corresponde ao formato esperado.',
          status: 422,
        });
      case 'import-idempotency-mismatch':
        throw new ApiErrorException({
          code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
          message:
            'Esta operação já foi registrada com um arquivo diferente.',
          status: 409,
        });
      case 'import-already-processed':
        throw new ApiErrorException(
          attachExistingJobId({
            code: 'IMPORT_ALREADY_PROCESSED',
            message: 'Este arquivo já foi importado.',
            status: 409,
            location: `/api/import/jobs/${alreadyProcessedJobId}`,
          }),
        );
      default:
        break;
    }
  }

  private resolveUploadOutcome(): MockUploadOutcome {
    switch (this.options.scenario) {
      case 'import-completed-with-errors':
        return uploadOutcomes.completedWithErrors!;
      case 'import-failed':
        return uploadOutcomes.failed!;
      case 'import-pending':
        return uploadOutcomes.pending!;
      case 'import-running':
        return uploadOutcomes.running!;
      default:
        return uploadOutcomes.completed!;
    }
  }

  async upload(
    input: ImportUploadInput,
    options: ImportUploadOptions = {},
  ): Promise<ImportJob> {
    /* O arquivo é usado apenas para disparar o fluxo; nada dele é lido. */
    void input;
    const stepDelay = Math.max(90, Math.round(this.options.delayMs / 2));

    for (const percent of uploadProgressSteps) {
      if (options.signal?.aborted) {
        throw abortedError();
      }

      options.onUploadProgress?.(percent);
      await simulateMockLatency(stepDelay);
    }

    if (options.signal?.aborted) {
      throw abortedError();
    }

    await this.prepare();
    this.rejectUploadWhenScenarioRequires();

    const outcome = this.resolveUploadOutcome();
    const now = new Date().toISOString();
    const job: ImportJob = {
      id: createId('import-job'),
      importFileId: createId('import-file'),
      status: outcome.status,
      totalRecords: outcome.totalRecords,
      processedRecords: outcome.processedRecords,
      successCount: outcome.successCount,
      errorCount: outcome.errorCount,
      createdAt: now,
      updatedAt: now,
      ...(outcome.status === 'PENDING' ? {} : { startedAt: now }),
      ...(outcome.status === 'COMPLETED' ||
      outcome.status === 'COMPLETED_WITH_ERRORS' ||
      outcome.status === 'FAILED'
        ? { finishedAt: now }
        : {}),
    };
    const errors: DemoImportJobError[] = outcome.errors.map((error, index) => ({
      ...error,
      id: `${job.id}-error-${index + 1}`,
      importJobId: job.id,
      createdAt: now,
    }));

    this.store.update((draft) => {
      draft.importJobs = [job, ...draft.importJobs];
      draft.importJobErrors = [...errors, ...draft.importJobErrors];
    });

    return job;
  }

  async listJobs(params: ImportJobListParams): Promise<ImportJobPage> {
    await this.prepare();

    const jobs =
      this.options.scenario === 'empty' ||
      this.options.scenario === 'imports-empty'
        ? []
        : this.store.getState().importJobs;
    const filtered = params.status
      ? jobs.filter((job) => job.status === params.status)
      : jobs;
    const sorted = [...filtered].sort((a, b) => {
      const comparison = (a.createdAt ?? '').localeCompare(
        b.createdAt ?? '',
        'pt-BR',
      );
      const result = comparison === 0 ? a.id.localeCompare(b.id) : comparison;
      return params.sort.direction === 'asc' ? result : -result;
    });

    const size = Math.max(1, params.size);
    const totalElements = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const page = Math.min(Math.max(0, params.page), totalPages - 1);
    const start = page * size;

    return {
      content: sorted.slice(start, start + size),
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  }

  async getJobById(id: string): Promise<ImportJobDetails> {
    await this.prepare();
    const stored = this.store
      .getState()
      .importJobs.find((job) => job.id === id);

    if (!stored) {
      throw new ApiErrorException({
        code: 'IMPORT_JOB_NOT_FOUND',
        message: 'A importação informada não foi encontrada.',
        status: 404,
      });
    }

    const job = this.advanceWhenPolling(stored);

    return {
      job,
      errors: this.store
        .getState()
        .importJobErrors.filter((error) => error.importJobId === job.id)
        .map(({ importJobId, ...error }) => {
          void importJobId;
          return error;
        }),
    };
  }

  /**
   * Faz o job avançar apenas enquanto estiver em estado não terminal, seguindo
   * a sequência definida pelo cenário. Ao chegar a um status terminal, novas
   * consultas devolvem sempre o mesmo resultado.
   */
  private advanceWhenPolling(job: ImportJob): ImportJob {
    const transitions = pollingTransitions[this.options.scenario];

    if (!transitions || job.status === 'COMPLETED' || job.status === 'FAILED') {
      return job;
    }

    if (job.status !== 'PENDING' && job.status !== 'RUNNING') {
      return job;
    }

    const attempt = (this.pollCounts.get(job.id) ?? 0) + 1;
    this.pollCounts.set(job.id, attempt);
    const outcome = transitions[Math.min(attempt, transitions.length) - 1];

    if (!outcome) {
      return job;
    }

    const now = new Date().toISOString();
    const advanced: ImportJob = {
      ...job,
      status: outcome.status,
      totalRecords: outcome.totalRecords,
      processedRecords: outcome.processedRecords,
      successCount: outcome.successCount,
      errorCount: outcome.errorCount,
      startedAt: job.startedAt ?? now,
      updatedAt: now,
      ...(outcome.status === 'RUNNING' ? {} : { finishedAt: now }),
    };

    this.store.update((draft) => {
      draft.importJobs = draft.importJobs.map((item) =>
        item.id === advanced.id ? advanced : item,
      );
    });

    return advanced;
  }
}
