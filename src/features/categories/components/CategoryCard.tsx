import { Card } from '../../../components/ui';
import type { Category } from '../types/categorization';

/**
 * Exibe somente os campos publicados por `CategoryResponse`. Quando o backend
 * não retorna `color`, a marca visual usa o token neutro do Design System.
 */
export function CategoryCard({ category }: { category: Category }) {
  return (
    <Card as="article" className="category-card">
      <span
        aria-hidden="true"
        className={`category-card__swatch ${
          category.color ? '' : 'category-card__swatch--neutral'
        }`.trim()}
        style={category.color ? { backgroundColor: category.color } : undefined}
      />
      <div className="category-card__copy">
        <h2>{category.name}</h2>
        <p>{category.color ? 'Categoria' : 'Categoria sem cor definida'}</p>
      </div>
    </Card>
  );
}
