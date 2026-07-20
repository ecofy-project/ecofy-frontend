import type { Money } from '../../../services/money/money';

export type FoundationSummary = Readonly<{
  architectureLayers: readonly string[];
  demonstrationAmount: Money;
  themeModeCount: number;
  responsiveRangeCount: number;
  statusLabel: string;
  sourceNotice: string;
}>;
