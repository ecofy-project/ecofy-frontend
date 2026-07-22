import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
import { normalizePage } from '../../../services/pagination/pagination';
import type {
  ImportJob,
  ImportJobDetails,
  ImportJobListParams,
  ImportJobPage,
  ImportUploadInput,
  ImportUploadOptions,
} from '../types/import';
import type { ImportDataSource } from './import-data-source';
import {
  attachExistingJobId,
  mapImportJob,
  mapImportJobDetails,
} from './import-mappers';

const ingestionGatewayPath = '/ingestion/api/import';

/** Motivos de conflito em que o job já existente pode ser localizado. */
const alreadyProcessedCode = 'IMPORT_ALREADY_PROCESSED';

export class ApiImportDataSource implements ImportDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Envia o arquivo em `multipart/form-data`.
   *
   * O corpo é um `FormData`, então o cliente HTTP não define `Content-Type` e o
   * navegador escreve o header com o boundary correto. `Idempotency-Key` é
   * gerada por operação de upload — nunca derivada do nome do arquivo — e fica
   * fora da interface comum.
   *
   * `onUploadProgress` não é chamado: o cliente HTTP usa `fetch`, que não expõe
   * progresso de envio, e nenhuma biblioteca foi adicionada só para isso. A
   * interface apresenta um indicador indeterminado nesse caso.
   */
  async upload(
    input: ImportUploadInput,
    options: ImportUploadOptions = {},
  ): Promise<ImportJob> {
    const body = new FormData();
    body.append('file', input.file);

    if (input.type) {
      body.append('type', input.type);
    }

    try {
      const response = await this.httpClient.request<unknown>(
        `${ingestionGatewayPath}/file`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': createCorrelationId() },
          body,
          ...(options.signal ? { signal: options.signal } : {}),
        },
      );

      return mapImportJob(response.data);
    } catch (error: unknown) {
      throw enrichConflictWithExistingJob(error);
    }
  }

  /**
   * Listagem paginada do histórico.
   *
   * `status` só é enviado quando um valor específico é escolhido: o contrato
   * não define um valor para "todos". A ordenação usa o formato `campo,direção`
   * e apenas o campo referenciado pelo contrato.
   */
  async listJobs(params: ImportJobListParams): Promise<ImportJobPage> {
    const response = await this.httpClient.request<unknown>(
      `${ingestionGatewayPath}/jobs`,
      {
        query: {
          page: params.page,
          size: params.size,
          sort: `${params.sort.field},${params.sort.direction}`,
          ...(params.status ? { status: params.status } : {}),
        },
      },
    );

    return normalizePage(response.data, mapImportJob);
  }

  async getJobById(id: string): Promise<ImportJobDetails> {
    const response = await this.httpClient.request<unknown>(
      `${ingestionGatewayPath}/jobs/${encodeURIComponent(id)}`,
    );

    return mapImportJobDetails(response.data);
  }
}

/**
 * Quando o conflito indica arquivo já importado, o identificador do job
 * existente é extraído do header `Location` e anexado aos detalhes do erro,
 * permitindo que a interface ofereça a ação de abrir a importação anterior.
 */
function enrichConflictWithExistingJob(error: unknown): unknown {
  if (
    !(error instanceof ApiErrorException) ||
    error.apiError.status !== 409 ||
    error.apiError.code !== alreadyProcessedCode
  ) {
    return error;
  }

  return new ApiErrorException(attachExistingJobId(error.apiError));
}
