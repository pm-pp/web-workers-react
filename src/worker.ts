function getProducts() {
  const products = Array.from({ length: 5000 }, () => {
    const category = ['Electronics', 'Clothing', 'Toys'][
      Math.floor(Math.random() * 3)
    ];

    return {
      id: Math.random().toString(36).substring(2, 9),
      name: `Product #${category.charAt(0)}${Math.floor(Math.random() * 1000)}`,
      category,
      price: Math.floor(Math.random() * 100)
    };
  });

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
      const { products, category, name } = event.data;

      const filteredProducts = products.filter(
        (product) =>
          (category.length > 0 ? product.category === category : true) &&
          (name.length > 0
            ? product.name
                .toLocaleLowerCase()
                .includes(name.toLocaleLowerCase())
            : true)
      );

      self.postMessage({
        filteredProducts,
        type: 'filtered'
      } as WWOutput);

      break;
    }

    default:
      break;
  }
});
