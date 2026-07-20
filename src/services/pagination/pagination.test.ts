import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePage, toPageSearchParams } from './pagination.ts';

test('normaliza uma resposta paginada sem alterar arrays simples', () => {
  const page = normalizePage(
    {
      content: [{ id: 1 }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    },
    (item) => item as { id: number },
  );

  assert.equal(page.content[0]?.id, 1);
  assert.throws(() => normalizePage([], (item) => item));
});

test('serializa parâmetros de página separadamente do componente visual', () => {
  const params = toPageSearchParams({
    page: 2,
    size: 25,
    sort: ['createdAt,desc', 'id,asc'],
  });

  assert.equal(
    params.toString(),
    'page=2&size=25&sort=createdAt%2Cdesc&sort=id%2Casc',
  );
});
