import assert from 'node:assert/strict';
import test from 'node:test';
import { adaptApiError } from './api-error.ts';

test('normaliza códigos no nível raiz e em details', () => {
  assert.equal(
    adaptApiError({ code: 'USER_PROFILE_NOT_FOUND', message: 'Ausente' }).code,
    'USER_PROFILE_NOT_FOUND',
  );
  assert.equal(
    adaptApiError({
      details: { code: 'BUDGET_NOT_FOUND' },
      message: 'Ausente',
    }).code,
    'BUDGET_NOT_FOUND',
  );
});

test('preserva validação e remove detalhes internos', () => {
  const error = adaptApiError(
    {
      message: 'Dados inválidos',
      fieldErrors: [
        { field: 'amount', message: 'Obrigatório', code: 'REQUIRED' },
      ],
      details: {
        reason: 'validation',
        stackTrace: 'não deve sair da infraestrutura',
      },
    },
    { status: 400, correlationId: 'correlation-123' },
  );

  assert.deepEqual(error.fieldErrors, [
    { field: 'amount', message: 'Obrigatório', code: 'REQUIRED' },
  ]);
  assert.deepEqual(error.details, { reason: 'validation' });
  assert.equal(error.traceId, 'correlation-123');
});

test('substitui mensagens internas em erros 5xx', () => {
  const error = adaptApiError(
    { message: 'NullPointerException no serviço interno' },
    { status: 500 },
  );

  assert.equal(error.message, 'Não foi possível concluir a operação.');
});
