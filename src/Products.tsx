import {
  useRef,
  useEffect,
  useReducer,
  useCallback,
  ChangeEventHandler
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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

type Status = 'idle' | 'loading' | 'filtering' | 'resetting';

const STATUS_MESSAGES = {
  idle: 'No products found matching the filters.',
  loading: 'Loading...',
  filtering: 'Filtering...',
  resetting: 'Resetting...'
} as Record<Status, string>;

type State = {
  status: Status;
  products: Product[];
  filteredProducts: Product[];
};

type Action =
  | { type: 'set-products'; products: Product[] }
  | { type: 'set-filtered-products'; filteredProducts: Product[] }
  | { type: 'reset' }
  | { type: 'filtering' }
  | { type: 'resetting' };

const INITIAL_STATE: State = {
  status: 'idle',
  products: [],
  filteredProducts: []
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
        status: 'idle',
        products: state.products,
        filteredProducts: state.products
      };
    default:
      return state;
  }
};

export function Products() {
  const [{ status, filteredProducts, products }, dispatch] = useReducer(
    reducer,
    INITIAL_STATE
  );
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
  const handleFilterProduct: ChangeEventHandler<HTMLSelectElement> =
    useCallback(
      (event) => {
        if (worker) {
          dispatch({ type: 'filtering' });
          worker.postMessage({
            type: 'filter',
            filter: event.target.value,
            products
          } as WWInput);
        }
      },
      [products, worker]
    );

  const listRef = useRef(null);
  const listVirtualizer = useVirtualizer({
    count: filteredProducts.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 114,
    overscan: 2,
    gap: 16
  });

  return (
    <div className="flex flex-col gap-4 min-w-xs">
      <div className="flex gap-2 justify-between">
        <select
          value={
            products.length === filteredProducts.length &&
            status !== 'filtering'
              ? ''
              : undefined
          }
          disabled={status !== 'idle'}
          onChange={handleFilterProduct}
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

      {(status !== 'idle' ||
        (filteredProducts.length === 0 && status === 'idle')) && (
        <p className="text-center">{STATUS_MESSAGES[status]}</p>
      )}
      {status === 'idle' && (
        <p className="text-center">{filteredProducts.length} products</p>
      )}

      <div ref={listRef} className="grow overflow-auto">
        <ul
          className="relative w-full flex flex-col gap-4"
          style={{ height: `${listVirtualizer.getTotalSize()}px` }}
        >
          {listVirtualizer.getVirtualItems().map((item) => {
            const product = filteredProducts[item.index];

            return (
              <li
                key={item.key}
                className="absolute top-0 left-0 w-full flex flex-col gap-1 border rounded p-4 bg-white"
                style={{
                  height: `${item.size}px`,
                  transform: `translateY(${item.start}px)`
                }}
              >
                <div className="text-lg font-bold">{product.name}</div>
                <div>${product.price}</div>
                <div className="text-sm">({product.category})</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
