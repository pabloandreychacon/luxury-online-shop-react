import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PriceListOption {
  id: number;
  label: string;
  price: number;
}

export function useProductPriceLists(productId: string | number) {
  const [options, setOptions] = useState<PriceListOption[]>([]);

  useEffect(() => {
    if (!productId) return;
    supabase
      .from('ProductListPrices')
      .select('Id, Price, PriceListId, PriceLists(Label)')
      .eq('ProductId', productId)
      .then(({ data }) => {
        setOptions(
          (data || []).map((row: any) => ({
            id: row.PriceListId,
            label: row.PriceLists?.Label || String(row.PriceListId),
            price: row.Price,
          }))
        );
      });
  }, [productId]);

  return options;
}
