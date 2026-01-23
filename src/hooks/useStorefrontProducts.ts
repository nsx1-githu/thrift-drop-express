import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  images: string[];
  category: Product["category"];
  condition: Product["condition"];
  size: Product["size"];
  description: string | null;
  sold_out: boolean;
  created_at: string;
};

const mapRowToProduct = (row: ProductRow): Product => {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    images: row.images ?? [],
    category: row.category,
    condition: row.condition,
    size: row.size,
    description: row.description ?? "",
    soldOut: row.sold_out,
    createdAt: new Date(row.created_at),
  };
};

export const useStorefrontProducts = () => {
  return useQuery({
    queryKey: ["storefront-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,brand,price,original_price,images,category,condition,size,description,sold_out,created_at",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as ProductRow[]).map(mapRowToProduct);
    },
    staleTime: 10_000,
  });
};
