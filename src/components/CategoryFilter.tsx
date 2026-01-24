import { Category } from '@/types/product';
import { Constants } from "@/integrations/supabase/types";

interface CategoryFilterProps {
  selected: Category | 'all';
  onSelect: (category: Category | 'all') => void;
}

export const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  const categories = [
    { id: "all", name: "All" },
    ...Constants.public.Enums.product_category.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
    })),
  ] as const;

  return (
    <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-2 -mx-6 px-6">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id as Category | 'all')}
          className={`category-chip flex-shrink-0 ${
            selected === cat.id ? 'active' : ''
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
