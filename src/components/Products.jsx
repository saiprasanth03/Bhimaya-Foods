import React, { useState, useMemo } from 'react';

function Products({
  products,
  cart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
}) {

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Extract unique categories from the current product list
  const categories = useMemo(() => {
    if (!products) return ["All"];
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ["All", ...Array.from(cats)].sort();
  }, [products]);

  // Filter products based on search and selected category
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const searchQueryLower = searchQuery.toLowerCase();
    return products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(searchQueryLower);
      const descMatch = product.description?.toLowerCase().includes(searchQueryLower);
      const catMatch = product.category?.toLowerCase().includes(searchQueryLower);

      const matchesSearch = Boolean(nameMatch || descMatch || catMatch);
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <section id="products" className="py-10 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-playfair text-primary text-center mb-10">
          {/* Wholesome Delicacies */}
          Homestyle Delights
        </h2>

        {/* --- Search and Filter Bar --- */}
        <div className="mb-10 flex flex-col items-center max-w-3xl mx-auto">
          {/* Search Box */}
          <div className="w-full relative mb-6">
            <input
              type="text"
              placeholder="Search for sweets, snacks, nuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 shadow-sm"
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-orange-50 hover:text-primary hover:border-orange-200"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {/* --- End Search and Filter Bar --- */}

        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="text-xl">No products found matching your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 text-primary underline"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cart={cart}
              addToCart={addToCart}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
            />
          ))}
        </div>

        {/* --- Features Section --- */}
        <div className="mt-24 text-center mb-12">
          <h2 className="text-4xl font-playfair text-primary mb-4">Why Bhimaya Foods?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Discover why our traditional, homemade delicacies are the preferred choice for families.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border border-orange-50 text-center flex flex-col items-center">
            <div className="w-32 h-32 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
               <span className="text-5xl">🌿</span>
            </div>
            <h3 className="text-2xl font-playfair text-primary mb-4 font-bold">Chemical Free</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Enjoy the purity of traditional homemade foods made without harmful chemicals or preservatives. At Bhimaya Foods, we focus on natural ingredients and authentic preparation methods to bring you safe, healthy, and flavorful products.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border border-orange-50 text-center flex flex-col items-center">
            <div className="w-32 h-32 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
               <span className="text-5xl">🍲</span>
            </div>
            <h3 className="text-2xl font-playfair text-primary mb-4 font-bold">Authentic Taste</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Experience the true taste of tradition. Our foods are prepared using carefully selected ingredients and time-honored recipes, ensuring every bite delivers the rich and authentic flavors of homemade goodness.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border border-orange-50 text-center flex flex-col items-center">
            <div className="w-32 h-32 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
               <span className="text-5xl">🚚</span>
            </div>
            <h3 className="text-2xl font-playfair text-primary mb-4 font-bold">Fast Delivery</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Get your favorite traditional foods delivered fresh and quickly to your doorstep. With our reliable delivery service, Bhimaya Foods ensures your orders arrive safely and on time.
            </p>
          </div>
        </div>
        {/* --- End Features Section --- */}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  cart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
}) {
  const availableWeightsList = product.availableWeights || ['1000gm'];
  const [selectedWeight, setSelectedWeight] = useState(() => {
    if (availableWeightsList.includes("500gm")) return "500gm";
    return availableWeightsList[0];
  });

  const allWeights = [
    { label: "250gm", factor: 0.25 },
    { label: "500gm", factor: 0.5 },
    { label: "1000gm", factor: 1 },
  ];

  const weights = allWeights.filter(w => availableWeightsList.includes(w.label));

  const basePrice = parseFloat(product.price) || 0;
  const currentPrice = Math.round(basePrice * (allWeights.find(w => w.label === selectedWeight)?.factor || 1));
  const cartItemId = `${product.id}_${selectedWeight}`;
  
  const qty = cart.find((item) => item.cartItemId === cartItemId)?.quantity || 0;
  const isOutOfStock =
    product.quantity?.toLowerCase().includes('out of stock') ||
    product.description?.toLowerCase().includes('out of stock') ||
    product.quantity === '0';

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col h-full">
      <div className="relative h-64 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-110 transition duration-500"
        />
        <span className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full text-sm">
          {product.category}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-semibold text-primary mb-2">
          {product.name}
        </h3>

        <div className="mt-1 mb-2 min-h-[1.25rem]">
          {product.description && (
            <p className={`text-sm ${product.description.toLowerCase().includes('out of stock') ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
              {product.description}
            </p>
          )}
        </div>

        {/* Weight Selection */}
        <div className="flex gap-2 mb-6">
          {weights.map((w) => (
            <button
              key={w.label}
              onClick={() => setSelectedWeight(w.label)}
              className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all border ${selectedWeight === w.label
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary"
                }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <span className="text-2xl font-bold text-primary">
            ₹{currentPrice}
          </span>

          {qty > 0 ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => decreaseQuantity(cartItemId)}
                className="w-8 h-8 flex items-center justify-center border border-primary rounded-full transition hover:bg-orange-50 text-primary font-bold"
              >
                -
              </button>
              <span className="font-semibold w-4 text-center">{qty}</span>
              <button
                onClick={() => increaseQuantity(cartItemId)}
                className="w-8 h-8 flex items-center justify-center border border-primary rounded-full transition hover:bg-orange-50 text-primary font-bold"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => !isOutOfStock && addToCart(product, selectedWeight, currentPrice)}
              disabled={isOutOfStock}
              className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
                : "bg-primary text-white hover:bg-orange-700 shadow-md hover:shadow-lg active:scale-95"
                }`}
            >
              {isOutOfStock ? "Out of Stock" : "Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;