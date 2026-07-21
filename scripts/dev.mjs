/**
 * Inicia o Vite aplicando overrides de cenário do Mock Mode sem exigir um
 * arquivo `.env` por combinação.
 *
 * Uso:
 *   npm run dev:mock -- scenario=categories-empty
 *   npm run dev:mock -- auth=rate_limited delay=150
 *   npm run dev:mock -- mode=api
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const overrides = {
  scenario: 'VITE_MOCK_SCENARIO',
  auth: 'VITE_MOCK_AUTH_SCENARIO',
  delay: 'VITE_MOCK_DELAY_MS',
  roles: 'VITE_MOCK_USER_ROLES',
  permissions: 'VITE_MOCK_USER_PERMISSIONS',
};

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const separator = argument.indexOf('=');
    return separator === -1
      ? [argument, '']
      : [argument.slice(0, separator), argument.slice(separator + 1)];
  }),
);

const unknownArgs = [...args.keys()].filter(
  (key) => key !== 'mode' && !(key in overrides),
);

if (unknownArgs.length > 0) {
  console.error(
    `Argumento não reconhecido: ${unknownArgs.join(', ')}.\n` +
      `Use mode, ${Object.keys(overrides).join(', ')}.`,
  );
  process.exit(1);
}

const env = { ...process.env };

for (const [argument, variable] of Object.entries(overrides)) {
  const value = args.get(argument);

  if (value) {
    env[variable] = value;
  }
}

const require = createRequire(import.meta.url);
const viteBin = join(
  dirname(require.resolve('vite/package.json')),
  'bin',
  'vite.js',
);

const child = spawn(
  process.execPath,
  [viteBin, '--mode', args.get('mode') || 'mock'],
  { stdio: 'inherit', env },
);

child.on('exit', (code) => process.exit(code ?? 0));
