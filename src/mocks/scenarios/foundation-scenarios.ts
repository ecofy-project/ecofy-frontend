import type { FoundationSummary } from '../../features/foundation/types/foundation-summary';
import type { MockScenario } from '../../services/config/env';
import type { ApiError } from '../../services/errors/api-error';
import { fromCents } from '../../services/money/money';
import { defaultFoundationSummary } from '../data/foundation-summary';

export type FoundationMockResult =
  | { kind: 'success'; data: FoundationSummary }
  | { kind: 'error'; error: ApiError };

const emptyFoundationSummary: FoundationSummary = Object.freeze({
  ...defaultFoundationSummary,
  architectureLayers: Object.freeze([]),
  demonstrationAmount: fromCents(0, 'BRL'),
  statusLabel: 'Cenário vazio',
  sourceNotice:
    'O contrato continua válido mesmo quando o Data Source não possui conteúdo.',
});

const processingFoundationSummary: FoundationSummary = Object.freeze({
  ...defaultFoundationSummary,
  statusLabel: 'Cenário em processamento',
  sourceNotice:
    'A infraestrutura mock pode representar transições assíncronas sem lógica no componente.',
});

export function resolveFoundationMockScenario(
  scenario: MockScenario,
): FoundationMockResult {
  switch (scenario) {
    case 'empty':
      return { kind: 'success', data: emptyFoundationSummary };
    case 'processing':
      return { kind: 'success', data: processingFoundationSummary };
    case 'error':
      return {
        kind: 'error',
        error: {
          code: 'FOUNDATION_UNAVAILABLE',
          message: 'Não foi possível carregar a demonstração.',
          status: 500,
        },
      };
    case 'degraded':
      return {
        kind: 'error',
        error: {
          code: 'FOUNDATION_DEGRADED',
          message: 'A demonstração está temporariamente degradada.',
          status: 503,
        },
      };
    case 'default':
    case 'loading':
    case 'profile-incomplete':
    case 'preferences-empty':
    case 'connections-empty':
    case 'connections-multiple':
      return { kind: 'success', data: defaultFoundationSummary };
  }
}
