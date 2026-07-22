import type { ImportError } from '../types/import';
import { importErrorTypeLabel } from '../utils/import-labels';

type ImportErrorListProps = {
  errors: readonly ImportError[];
};

/**
 * Erros por linha. Apresenta somente linha, tipo e mensagem — a linha original
 * do arquivo (`rawContent`) não é mapeada nem exibida em nenhuma hipótese.
 */
export function ImportErrorList({ errors }: ImportErrorListProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="import-error-list">
      <table className="import-table import-table--errors">
        <caption className="sr-only">Erros encontrados por linha</caption>
        <thead>
          <tr>
            <th scope="col">Linha</th>
            <th scope="col">Tipo</th>
            <th scope="col">Mensagem</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error, index) => (
            <tr key={error.id ?? `${error.lineNumber ?? 'sem-linha'}-${index}`}>
              <td className="numeric">
                {error.lineNumber === undefined ? '—' : error.lineNumber}
              </td>
              <td>{importErrorTypeLabel(error.errorType)}</td>
              <td>{error.message}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="import-error-cards">
        {errors.map((error, index) => (
          <li key={error.id ?? `card-${error.lineNumber ?? 'sem-linha'}-${index}`}>
            <div className="import-error-cards__heading">
              <strong>
                {error.lineNumber === undefined
                  ? 'Arquivo'
                  : `Linha ${error.lineNumber}`}
              </strong>
              <span>{importErrorTypeLabel(error.errorType)}</span>
            </div>
            <p>{error.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
