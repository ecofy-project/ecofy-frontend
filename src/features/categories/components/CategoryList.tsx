import type { Category } from '../types/categorization';
import { CategoryCard } from './CategoryCard';

export function CategoryList({
  categories,
}: {
  categories: readonly Category[];
}) {
  return (
    <section
      aria-label="Categorias cadastradas"
      className="demo-card-grid demo-card-grid--categories"
    >
      {categories.map((category) => (
        <CategoryCard category={category} key={category.id} />
      ))}
    </section>
  );
}
