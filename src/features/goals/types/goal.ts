/**
 * Contratos de metas confirmados em `ms-insights`.
 *
 * Lidos de `GoalsController`, `GoalResponse`, `CreateGoalRequest`,
 * `UpdateGoalRequest` e do enum `GoalStatus`. Nada foi inventado.
 */

/** `GoalStatus` publicado pelo domínio. */
export const goalStatuses = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;

export type GoalStatus = (typeof goalStatuses)[number];

/**
 * Modelo interno de meta.
 *
 * O contrato publica apenas o valor alvo: não existe valor acumulado, saldo
 * atual, percentual nem data alvo. Por isso a interface não apresenta barra de
 * progresso — o progresso não é calculado a partir de transações, orçamentos
 * ou métricas.
 */
export type Goal = Readonly<{
  id: string;
  name: string;
  targetCents: number;
  currency: string;
  status: GoalStatus;
  createdAt?: string;
  updatedAt?: string;
}>;

/** `CreateGoalRequest` sem `userId`: ele é resolvido a partir da sessão. */
export type CreateGoalInput = Readonly<{
  name: string;
  targetCents: number;
  currency: string;
  /** Opcional no contrato; o serviço aplica `ACTIVE` quando ausente. */
  status?: GoalStatus;
}>;

/** `UpdateGoalRequest`: todos os campos são opcionais. */
export type UpdateGoalInput = Readonly<{
  name?: string;
  targetCents?: number;
  currency?: string;
  status?: GoalStatus;
}>;
