import type { CreateGoalInput, Goal, UpdateGoalInput } from '../types/goal';

/**
 * Contrato único consumido pela feature. Mock e API implementam exatamente esta
 * interface. `GET /goals` devolve a lista completa do usuário, sem paginação,
 * então o modelo interno também é uma lista.
 */
export interface GoalDataSource {
  listGoals(): Promise<readonly Goal[]>;
  createGoal(input: CreateGoalInput): Promise<Goal>;
  updateGoal(id: string, input: UpdateGoalInput): Promise<Goal>;
}
