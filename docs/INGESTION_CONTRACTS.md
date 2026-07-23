# Contratos de importação consumidos pelo frontend

Todos os contratos abaixo foram lidos diretamente de `ImportController`,
`ImportJobResponse`, `ImportErrorResponse`, `ImportJobStatusResponse`, dos enums
de domínio, do `IngestionErrorCode`, do `RestExceptionHandler` e das rotas do
`api-gateway`. Nenhum campo, enum, endpoint ou código de erro foi inventado.

## Endpoints utilizados

| Método | Caminho | Uso no frontend |
| --- | --- | --- |
| `POST` | `/ingestion/api/import/file` | Upload do arquivo (`multipart/form-data`) |
| `GET` | `/ingestion/api/import/jobs/{id}` | Status do job e erros por linha |
| `GET` | `/ingestion/api/import/jobs` | Histórico paginado (**ainda não publicado**) |

Todas as chamadas passam pelo HTTP Client apontado ao API Gateway. Nenhuma porta
ou URL direta do microsserviço é utilizada. O gateway declara o predicado
público `/api/v1/ingestion/**`, que reescreve para `/ingestion/api/import/...`,
e mantém a rota legada `/ingestion/**`.

## Contratos confirmados

- `POST /file` recebe `file` (obrigatório) e `type` (opcional). Quando `type`
  não é enviado, o serviço infere pelo sufixo `.csv` ou `.ofx` do nome.
- O processamento é **síncrono**: a resposta `200 OK` já traz o job com status
  final e contadores, e um header `Location` apontando para
  `/api/import/jobs/{id}`.
- `ImportJobResponse`: `id`, `importFileId`, `status`, `totalRecords`,
  `processedRecords`, `successCount`, `errorCount`, `startedAt`, `finishedAt`,
  `createdAt`, `updatedAt`.
- `ImportJobStatusResponse`: `job` + `errors`.
- `ImportErrorResponse`: `id`, `importJobId`, `lineNumber`, `rawContent`,
  `errorType`, `errorMessage`, `createdAt`.
- `ImportJobStatus`: `PENDING`, `RUNNING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`,
  `FAILED`.
- `ImportErrorType`: `PARSE_ERROR`, `VALIDATION_ERROR`, `STORAGE_ERROR`,
  `UNKNOWN`.
- `ImportFileType`: `CSV`, `OFX` e `EVENT`. Este último é origem sintética de
  ingestão via Kafka, nunca um tipo de upload.
- Limite de tamanho (`ecofy.ingestion.storage.max-file-size-bytes`): 10 MB em
  desenvolvimento, 20 MB em produção, 5 MB em teste.
- Erros publicados: `FILE_TOO_LARGE` (413), `INVALID_FILE_SIZE` (400),
  `UNSUPPORTED_IMPORT_FILE_TYPE` (400), `IMPORT_FILE_TYPE_REQUIRED` (400),
  `PARSE_ERROR` (422), `IMPORT_FILE_STORED_PATH_MISSING` (422),
  `IMPORT_JOB_NOT_FOUND` (404), `IMPORT_FILE_NOT_FOUND` (404),
  `STORAGE_ERROR` (500), `PERSISTENCE_ERROR` (500), `PUBLISH_ERROR` (502),
  `EMPTY_TRANSACTIONS_PAYLOAD` (400), `VALIDATION_ERROR` (400),
  `MISSING_REQUIRED_PART` (400), `INVALID_MULTIPART` (400),
  `INVALID_REQUEST` (400) e `INTERNAL_ERROR` (500). O corpo segue
  `{ timestamp, status, code, message, path, fieldErrors }`, sem stack trace e
  sem caminho local de arquivo.

## Decisões e divergências documentadas

1. **`GET /jobs` ainda não existe.** O `ImportController` publica apenas o
   upload e a consulta por id. O Data Source de API chama exatamente o caminho
   previsto pela especificação (`/ingestion/api/import/jobs` com `page`, `size`,
   `sort` e `status`), de modo que o histórico passa a funcionar assim que o
   endpoint for publicado. Enquanto isso, em API Mode a chamada falha e a
   interface apresenta o mesmo `ErrorState` de qualquer outra falha. O Mock Mode
   implementa a listagem completa, com paginação, filtro e ordenação em memória.
2. **`rawContent` nunca é mapeado.** O contrato publica a linha original do
   arquivo em cada erro. Esse campo é deliberadamente ignorado no mapper, então
   não existe no modelo interno e não pode chegar à interface.
3. **Contadores ausentes no contrato.** `duplicateRecords`, `publishedRecords`,
   `recordedErrors`, `errorsTruncated`, `failureCode`, `failureReason` e
   `correlationId` não são publicados por `ImportJobResponse`. O modelo interno
   não os declara e a interface não os exibe. Quando o serviço passar a
   publicá-los, basta estendê-los no mapper.
4. **`FAILED` é apresentado sem `failureCode`/`failureReason`.** Como o contrato
   não publica esses campos, a falha global usa a descrição de status e a
   mensagem normalizada pelo Error Adapter.
5. **Códigos de conflito previstos pela etapa não são emitidos hoje.**
   `IMPORT_ALREADY_PROCESSED` e `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` não existem
   em `IngestionErrorCode`. A interface os reconhece, já que o custo é nulo e o
   comportamento fica pronto, e o Mock Mode os reproduz de forma determinística
   para validar o fluxo. A classificação de erros aceita, para cada caso, tanto
   o código real quanto o previsto:

   | Situação | Código real | Código previsto pela etapa |
   | --- | --- | --- |
   | Arquivo acima do limite | `FILE_TOO_LARGE` (413) | `FILE_SIZE_LIMIT_EXCEEDED` (413) |
   | Tipo não suportado | `UNSUPPORTED_IMPORT_FILE_TYPE` (400) | `UNSUPPORTED_FILE_TYPE` (415) |
   | Arquivo estruturalmente inválido | `PARSE_ERROR` (422) | `INVALID_FILE_HEADER` (422) |
   | Arquivo já importado | não publicado | `IMPORT_ALREADY_PROCESSED` (409) |
   | Idempotência divergente | não publicado | `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` (409) |
   | Acesso proibido | não publicado | `IMPORT_ACCESS_FORBIDDEN` (403) |

6. **`Idempotency-Key` é enviada, mas ainda não é consumida.** O controller
   aceita apenas `file` e `type`; diferentemente de budgeting e categorização,
   não há tratamento de idempotência. A chave é gerada por operação de upload,
   nunca derivada do nome do arquivo, e fica fora da interface comum, pronta
   para quando o serviço passar a considerá-la.
7. **`userId` não é enviado.** O proprietário é determinado pelo backend a
   partir do JWT; o formulário não pede e a interface não exibe esse dado.
8. **Progresso de upload é indeterminado em API Mode.** O HTTP Client usa
   `fetch`, que não expõe eventos de progresso de envio, e nenhuma biblioteca
   foi adicionada só para isso. A interface apresenta uma barra indeterminada e
   acessível nesse caso; o Mock Mode informa percentuais simulados. O
   cancelamento, por outro lado, é real nos dois modos, via `AbortSignal`.
9. **Polling só existe por robustez.** O upload é síncrono e devolve status
   terminal, então normalmente não há polling. Como a especificação exige
   compatibilidade com respostas intermediárias, o acompanhamento é iniciado
   apenas quando o job volta em `PENDING` ou `RUNNING`, para em status terminal,
   evita requests concorrentes, encerra ao desmontar e tem limite de tentativas.
