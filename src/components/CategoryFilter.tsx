import { motion } from 'framer-motion';
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
      {categories.map((cat, index) => (
        <motion.button
          key={cat.id}
          onClick={() => onSelect(cat.id as Category | 'all')}
          className={`category-chip flex-shrink-0 ${selected === cat.id ? 'active' : ''}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {cat.name}
        </motion.button>
      ))}
    </div>
  );
};
