import type { GoalDataSource } from '../data-sources/goal-data-source';
import type { CreateGoalInput, UpdateGoalInput } from '../types/goal';

export class GoalService {
  constructor(private readonly dataSource: GoalDataSource) {}

  listGoals() {
    return this.dataSource.listGoals();
  }

  createGoal(input: CreateGoalInput) {
    return this.dataSource.createGoal(input);
  }

  updateGoal(id: string, input: UpdateGoalInput) {
    return this.dataSource.updateGoal(id, input);
  }
}
