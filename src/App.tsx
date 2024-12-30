import { useRef, useEffect, useReducer, useCallback } from 'react';
import { ProductList } from './ProductList';

const useWorker = (
  setProducts: (products: Product[]) => void,
  filterProducts: (products: Product[]) => void
) => {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url));

    const handleMessage = (event: MessageEvent<WWOutput>) => {
      const { type } = event.data;
      if (type === 'generated') {
        setProducts(event.data.products);
      } else if (type === 'filtered') {
        filterProducts(event.data.filteredProducts);
      }
    };

    workerRef.current.addEventListener('message', handleMessage);
    workerRef.current.postMessage({
      type: 'generate'
    } as WWInput);

    return () => {
      if (workerRef.current) {
        workerRef.current.removeEventListener('message', handleMessage);
        workerRef.current.terminate();
      }
    };
  }, [setProducts, filterProducts]);

  return workerRef.current;
};

const CATEGORIES = ['Electronics', 'Clothing', 'Toys'];

type Status = 'idle' | 'filtering' | 'resetting';

const STATUS_MESSAGES = {
  idle: 'No products found matching the filters.',
  filtering: 'Filtering...',
  resetting: 'Resetting...'
} as Record<Status, string>;

type State = {
  status: Status;
  products: Product[];
  filteredProducts: Product[];
  category: Product['category'];
  name: string;
};

type Action =
  | { type: 'set-products'; products: Product[] }
  | { type: 'set-filtered-products'; filteredProducts: Product[] }
  | { type: 'search'; key: 'category' | 'name'; value: string }
  | { type: 'reset' }
  | { type: 'filtering' }
  | { type: 'resetting' };

const INITIAL_STATE: State = {
  status: 'idle',
  products: [],
  filteredProducts: [],
  category: '',
  name: ''
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'set-products':
      return {
        ...state,
        status: 'idle',
        products: action.products,
        filteredProducts: action.products
      };
    case 'set-filtered-products':
      return {
        ...state,
        filteredProducts: action.filteredProducts,
        status: 'idle'
      };
    case 'search':
      return {
        ...state,
        status: 'filtering',
        [action.key]: action.value
      };
    case 'filtering':
      return {
        ...state,
        status: 'filtering'
      };
    case 'resetting':
      return {
        ...state,
        status: 'resetting'
      };
    case 'reset':
      return {
        category: '',
        name: '',
        status: 'idle',
        products: state.products,
        filteredProducts: state.products
      };
    default:
      return state;
  }
};

function App() {
  const [{ name, category, status, filteredProducts, products }, dispatch] =
    useReducer(reducer, INITIAL_STATE);
  const setProducts = useCallback((products: Product[]) => {
    dispatch({ type: 'set-products', products });
  }, []);
  const setFilteredProducts = useCallback((filteredProducts: Product[]) => {
    dispatch({ type: 'set-filtered-products', filteredProducts });
  }, []);
  const handleReset = useCallback(() => {
    dispatch({ type: 'resetting' });
    setTimeout(() => {
      dispatch({ type: 'reset' });
    }, 500); // Simulating a short delay for visual feedback
  }, []);
  const worker = useWorker(setProducts, setFilteredProducts);
  const handleFilterProduct = useCallback(
    (key: 'category' | 'name', value: string) => {
      if (worker) {
        dispatch({ type: 'search', key, value });

        worker.postMessage({
          type: 'filter',
          products,
          category,
          name,
          [key]: value
        } as WWInput);
      }
    },
    [category, name, products, worker]
  );

  return (
    <main className="p-4 h-screen flex justify-center">
      <search
        className="flex flex-col gap-4 min-w-xs"
        title="List and search products"
      >
        <div className="flex gap-2 justify-between">
          <select
            value={category}
            disabled={status !== 'idle'}
            onChange={(event) =>
              handleFilterProduct('category', event.target.value)
            }
            className="px-4 py-2 flex-1 bg-white font-bold outline-none border-2 rounded border-purple-600 appearance-none bg-no-repeat bg-[right_10px_center] disabled:bg-purple-300 disabled:text-purple-200 hover:not-[:disabled]:bg-purple-700 hover:not-[:disabled]:text-white"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 4 5"><path fill="%23333" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>\')'
            }}
          >
            <option value="">All Products</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            onClick={handleReset}
            disabled={status !== 'idle'}
            className="rounded-sm border-2 border-purple-600 px-4 py-2 text-sm font-bold disabled:bg-purple-300 disabled:text-purple-200 hover:not-[:disabled]:bg-purple-700 hover:not-[:disabled]:text-white"
          >
            Reset
          </button>
        </div>

        <input
          type="search"
          value={name}
          placeholder="Search by product name..."
          className="w-full rounded-sm border-2 border-purple-600 px-4 py-2 text-sm disabled:text-purple-200 outline-none"
          onChange={(event) => handleFilterProduct('name', event.target.value)}
        />

        {(status !== 'idle' ||
          (filteredProducts.length === 0 && status === 'idle')) && (
          <p className="text-center">{STATUS_MESSAGES[status]}</p>
        )}
        {status === 'idle' && (
          <p className="text-center">{filteredProducts.length} products</p>
        )}

        <ProductList products={filteredProducts} />
      </search>
    </main>
  );
}

export { App };
