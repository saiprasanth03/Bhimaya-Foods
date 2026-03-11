function Cart({
  cart,
  products,
  total,
  isOpen,
  closeCart,
  increaseQuantity,
  decreaseQuantity,
  checkout,
}) {

  const DELIVERY_CHARGE = 50;
  const FREE_LIMIT = 599;

  const isItemOutOfStock = (item) => {
    const liveProduct = products?.find(p => p.id === item.id);
    return (
      liveProduct?.quantity?.toLowerCase().includes('out of stock') ||
      liveProduct?.description?.toLowerCase().includes('out of stock') ||
      liveProduct?.quantity === '0'
    );
  };

  const hasOutOfStockItem = cart.some(item => isItemOutOfStock(item));

  // ✅ Correct Delivery Logic
  const delivery =
    cart.length === 0
      ? 0
      : total >= FREE_LIMIT
        ? 0
        : DELIVERY_CHARGE;

  const finalTotal = total + delivery;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={closeCart}
          className="fixed inset-0 bg-black/50 z-40"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-lg z-50 flex flex-col transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 flex justify-between items-center border-b">
          <h3 className="text-xl font-semibold">Your Basket</h3>
          <button onClick={closeCart} className="text-2xl">
            &times;
          </button>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Your cart is empty.
            </p>
          ) : (
            cart.map((item) => {
              const outOfStock = isItemOutOfStock(item);
              return (
                <div key={item.id} className={`flex items-center space-x-4 ${outOfStock ? 'opacity-70' : ''}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />

                  <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    {outOfStock ? (
                      <p className="text-xs text-red-500 font-bold">⚠️ Out of Stock — Please remove</p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        ₹{item.price * item.quantity}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      className="w-7 h-7 border border-primary rounded-full"
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => !outOfStock && increaseQuantity(item.id)}
                      disabled={outOfStock}
                      className={`w-7 h-7 border rounded-full transition ${outOfStock ? 'border-gray-300 text-gray-300 cursor-not-allowed' : 'border-primary'}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t bg-white space-y-3">

          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{total}</span>
          </div>

          {/* Show delivery only if cart not empty */}
          {cart.length > 0 && (
            <>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span
                  className={
                    delivery === 0
                      ? "text-green-600 font-semibold"
                      : ""
                  }
                >
                  {delivery === 0 ? "FREE 🎉" : `₹${delivery}`}
                </span>
              </div>

              {total < FREE_LIMIT && (
                <p className="text-sm text-red-500">
                  Add ₹{FREE_LIMIT - total} more for FREE delivery
                </p>
              )}
            </>
          )}

          <div className="flex justify-between font-bold text-lg border-t pt-3">
            <span>Total:</span>
            <span>₹{finalTotal}</span>
          </div>

          <button
            onClick={checkout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-full mt-4 transition ${cart.length === 0
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-primary text-white hover:opacity-90"
              }`}
          >
            Proceed to WhatsApp
          </button>

        </div>
      </div>
    </>
  );
}

export default Cart;