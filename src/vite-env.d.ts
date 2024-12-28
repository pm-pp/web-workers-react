/// <reference types="vite/client" />

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

type WWInput =
  | {
      type: 'generate';
    }
  | {
      type: 'filter';
      products: Product[];
      filter: string;
    };

type WWOutput =
  | {
      type: 'generated';
      products: Product[];
    }
  | {
      type: 'filtered';
      filteredProducts: Product[];
    };
