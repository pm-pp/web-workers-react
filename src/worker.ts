function getProducts() {
  const products = Array.from({ length: 5000 }, () => ({
    id: Math.random().toString(36).substring(2, 9),
    name: `Product #${Math.floor(Math.random() * 1000)}`,
    category: ['Electronics', 'Clothing', 'Toys'][
      Math.floor(Math.random() * 3)
    ],
    price: Math.floor(Math.random() * 100)
  }));

  return Promise.resolve(products);
}

self.addEventListener('message', async (event: MessageEvent<WWInput>) => {
  const { type } = event.data;

  switch (type) {
    case 'generate': {
      self.postMessage({
        products: await getProducts(),
        type: 'generated'
      } as WWOutput);
      break;
    }

    case 'filter': {
      const { filter, products } = event.data;
      if (products && filter) {
        const filteredProducts = products.filter(
          (prod) => prod.category === filter
        );
        self.postMessage({
          filteredProducts,
          type: 'filtered'
        } as WWOutput);
      }
      break;
    }

    default:
      break;
  }
});
