import type { FoundationSummary } from '../../features/foundation/types/foundation-summary';
import { fromCents } from '../../services/money/money';

export const defaultFoundationSummary: FoundationSummary = Object.freeze({
  architectureLayers: Object.freeze([
    'Configuração e transporte',
    'Contratos internos',
    'Interface acessível',
  ]),
  demonstrationAmount: fromCents(1_240_000, 'BRL'),
  themeModeCount: 2,
  responsiveRangeCount: 4,
  statusLabel: 'Mock mode operacional',
  sourceNotice:
    'Este resumo foi fornecido por um Data Source assíncrono, sem chamadas ao backend.',
});
