import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fromCents,
  fromDecimalString,
  toCents,
  toDecimalString,
} from './money.ts';

test('converte cents sem usar ponto flutuante', () => {
  const money = fromCents(100_000, 'BRL');

  assert.equal(money.amount, 100_000n);
  assert.equal(toDecimalString(money), '1000.00');
  assert.equal(toCents(money), 100_000n);
});

test('converte string decimal preservando a precisão', () => {
  const money = fromDecimalString('1000.20', 'USD');

  assert.equal(money.amount, 100_020n);
  assert.equal(money.currency, 'USD');
  assert.equal(toDecimalString(money), '1000.20');
});

test('rejeita precisão maior que a escala declarada', () => {
  assert.throws(() => fromDecimalString('10.001', 'EUR'));
});
