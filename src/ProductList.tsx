import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function ProductList({ products }: { products: Product[] }) {
  const listRef = useRef(null);
  const listVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 114,
    overscan: 2,
    gap: 16
  });

  return (
    <div ref={listRef} className="grow overflow-auto">
      <ul
        className="relative w-full flex flex-col gap-4"
        style={{ height: `${listVirtualizer.getTotalSize()}px` }}
      >
        {listVirtualizer.getVirtualItems().map((item) => {
          const product = products[item.index];

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
  );
}
