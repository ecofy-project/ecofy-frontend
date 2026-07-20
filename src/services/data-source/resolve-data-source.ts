import type { AppDataMode } from '../config/env';

export type DataSourceFactories<TDataSource> = {
  mock: () => TDataSource;
  api: () => TDataSource;
};

export function resolveDataSource<TDataSource>(
  mode: AppDataMode,
  factories: DataSourceFactories<TDataSource>,
): TDataSource {
  return factories[mode]();
}
