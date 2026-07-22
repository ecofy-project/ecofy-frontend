import { createDemoSeed, type DemoState } from './demo-seed';

const storageKey = 'ecofy.demo.state.v1';

type DemoListener = () => void;

export interface DemoPersistence {
  read(): DemoState | null;
  write(state: DemoState): void;
  clear(): void;
}

function cloneState(state: DemoState): DemoState {
  return JSON.parse(JSON.stringify(state)) as DemoState;
}

function isDemoState(value: unknown): value is DemoState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const state = value as Partial<DemoState>;
  return (
    state.version === 4 &&
    typeof state.user === 'object' &&
    typeof state.profile === 'object' &&
    typeof state.preferences === 'object' &&
    Array.isArray(state.connections) &&
    Array.isArray(state.categories) &&
    Array.isArray(state.rules) &&
    Array.isArray(state.transactions) &&
    Array.isArray(state.suggestions) &&
    Array.isArray(state.budgets) &&
    Array.isArray(state.budgetRecords) &&
    Array.isArray(state.budgetConsumptions) &&
    Array.isArray(state.importJobs) &&
    Array.isArray(state.importJobErrors) &&
    Array.isArray(state.goals) &&
    Array.isArray(state.insights) &&
    Array.isArray(state.notifications)
  );
}

export function createDemoPersistence(): DemoPersistence {
  let memoryFallback: DemoState | null = null;

  return {
    read() {
      try {
        const value = window.localStorage.getItem(storageKey);
        const parsed = value ? (JSON.parse(value) as unknown) : null;
        return isDemoState(parsed) ? parsed : memoryFallback;
      } catch {
        return memoryFallback;
      }
    },
    write(state) {
      memoryFallback = cloneState(state);

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // O fallback em memória mantém a demonstração funcional nesta aba.
      }
    },
    clear() {
      memoryFallback = null;

      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // A próxima leitura ainda utilizará o seed inicial.
      }
    },
  };
}

export class DemoStore {
  private state: DemoState;
  private readonly listeners = new Set<DemoListener>();

  constructor(private readonly persistence: DemoPersistence) {
    this.state = persistence.read() ?? createDemoSeed();
    this.persistence.write(this.state);
  }

  getState() {
    return cloneState(this.state);
  }

  update(recipe: (draft: DemoState) => void) {
    const draft = cloneState(this.state);
    recipe(draft);
    this.state = draft;
    this.persistence.write(this.state);
    this.listeners.forEach((listener) => listener());
    return this.getState();
  }

  reset() {
    this.persistence.clear();
    this.state = createDemoSeed();
    this.persistence.write(this.state);
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: DemoListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}
