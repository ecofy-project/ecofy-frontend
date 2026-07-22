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
    case 'categories-empty':
    case 'category-create-error':
    case 'manual-error':
    case 'budgets-empty':
    case 'budget-single':
    case 'budgets-multiple':
    case 'budget-paused':
    case 'budget-archived':
    case 'consumption-partial':
    case 'consumption-full':
    case 'budget-conflict':
    case 'budget-error':
    case 'imports-empty':
    case 'import-completed':
    case 'import-completed-with-errors':
    case 'import-failed':
    case 'import-pending':
    case 'import-running':
    case 'import-already-processed':
    case 'import-idempotency-mismatch':
    case 'import-file-too-large':
    case 'import-unsupported-type':
    case 'import-invalid-header':
    case 'import-error':
    case 'dashboard-default':
    case 'dashboard-empty':
    case 'dashboard-error':
    case 'dashboard-degraded':
    case 'insights-empty':
    case 'insight-generation-success':
    case 'insight-generation-error':
    case 'rebuild-processing':
    case 'rebuild-completed':
    case 'goals-empty':
    case 'goals-multiple':
    case 'goal-error':
    case 'notifications-empty':
    case 'notifications-error':
    case 'notification-resend-failed':
    case 'notification-resend-error':
      return { kind: 'success', data: defaultFoundationSummary };
  }
}
