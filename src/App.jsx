import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import TopRibbon from "./components/TopRibbon";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Products from "./components/Products";
import About from "./components/About";
import Ribbon from "./components/Ribbon";
import Footer from "./components/Footer";
import Cart from "./components/Cart";
import Loader from "./components/Loader";
import Offline from "./components/Offline";
import Maintenance from "./components/Maintenance";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  // Skip loader if we already have cached products from this session
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('bhimaya_products');
    } catch { return true; }
  });
  const [storeSettings, setStoreSettings] = useState(null);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('bhimaya_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [products, setProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem('bhimaya_products');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Checkout Form State
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);

  const WHATSAPP_NUMBER = "919493023030";

  const addToCart = (product) => {
    const isOutOfStock =
      product.quantity?.toLowerCase().includes('out of stock') ||
      product.description?.toLowerCase().includes('out of stock') ||
      product.quantity === '0';

    if (isOutOfStock) return alert("Sorry, this item is out of stock.");

    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    // setIsCartOpen(true); // User requested to disable auto-open
  };

  const increaseQuantity = (id) => {
    const product = products.find(p => p.id === id);
    const isOutOfStock =
      product?.quantity?.toLowerCase().includes('out of stock') ||
      product?.description?.toLowerCase().includes('out of stock') ||
      product?.quantity === '0';
    if (isOutOfStock) return alert("Sorry, this item is currently out of stock and cannot be increased.");
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ));
  };

  const decreaseQuantity = (id) => {
    const item = cart.find(i => i.id === id);

    if (item.quantity === 1) {
      setCart(cart.filter(i => i.id !== id));
    } else {
      setCart(cart.map(i =>
        i.id === id
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const DELIVERY_CHARGE = 50;
  const FREE_LIMIT = 499;

  const delivery = total >= FREE_LIMIT ? 0 : DELIVERY_CHARGE;
  const finalTotal = total + delivery;

  const triggerCheckout = () => {
    if (storeSettings && storeSettings.isOpen === false) {
      return alert(storeSettings.closedMessage || "Sorry, the store is currently closed. We cannot process your order right now.");
    }
    if (cart.length === 0) return alert("Cart is empty!");

    // Final stock validation before checkout
    for (const cartItem of cart) {
      const liveProduct = products.find(p => p.id === cartItem.id);
      const isOutOfStock =
        liveProduct?.quantity?.toLowerCase().includes('out of stock') ||
        liveProduct?.description?.toLowerCase().includes('out of stock') ||
        liveProduct?.quantity === '0';
      if (isOutOfStock) {
        return alert(`Sorry, "${cartItem.name}" is currently out of stock. Please remove it from your cart to proceed.`);
      }
    }

    // Close cart and show checkout form
    setIsCartOpen(false);
    setShowCheckoutForm(true);
  };

  const generateOrderID = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${num}`;
  };

  const processOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      return alert("Please enter your name, phone number, and address.");
    }

    // Snapshot cart and form values before any async/state operations
    const cartSnapshot = [...cart];
    const nameSnapshot = customerName.trim();
    const phoneSnapshot = customerPhone.trim();
    // Prevent truncation by normalizing all types of linebreaks into commas
    const addressSnapshot = customerAddress.replace(/(\r\n|\n|\r)/gm, ", ").trim();
    const orderID = generateOrderID();

    // Construct the WhatsApp message
    let messageText = `*Order ID: ${orderID}*\n\n`;
    messageText += `*Order from Bhimaya Foods*\n`;
    messageText += `*Customer:* ${nameSnapshot}\n`;
    messageText += `*Phone:* ${phoneSnapshot}\n`;
    messageText += `*Address:* ${addressSnapshot}\n\n`;
    cartSnapshot.forEach(item => {
      messageText += `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}\n`;
    });
    if (delivery > 0) {
      messageText += `\n*Subtotal: ₹${total}*`;
      messageText += `\n*Delivery Charge: ₹${delivery}*`;
    } else {
      messageText += `\n*Free Delivery !*`;
    }
    messageText += `\n*Total: ₹${finalTotal}*`;

    const encodedMessage = encodeURIComponent(messageText);

    // ✅ Open WhatsApp IMMEDIATELY (before any await) to bypass browser popup blockers
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
      "_blank"
    );

    // Clear cart and close modals
    setCart([]);
    setShowCheckoutForm(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");

    // Save customer and order to Firestore in the background
    try {
      const customerDocRef = doc(db, "customers", phoneSnapshot);
      const customerDoc = await getDoc(customerDocRef);

      if (customerDoc.exists()) {
        const data = customerDoc.data();
        await updateDoc(customerDocRef, {
          name: nameSnapshot,
          address: addressSnapshot,
          totalOrders: (data.totalOrders || 0) + 1,
          lastOrderDate: serverTimestamp()
        });
      } else {
        await setDoc(customerDocRef, {
          name: nameSnapshot,
          phone: phoneSnapshot,
          address: addressSnapshot,
          totalOrders: 1,
          firstOrderDate: serverTimestamp(),
          lastOrderDate: serverTimestamp()
        });
      }

      const orderData = {
        orderID: orderID,
        customerName: nameSnapshot,
        customerPhone: phoneSnapshot,
        customerAddress: addressSnapshot,
        items: cartSnapshot.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || ''
        })),
        subtotal: total,
        deliveryCharge: delivery,
        totalAmount: finalTotal,
        status: 'Pending',
        paymentStatus: 'Pending',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "orders"), orderData);

    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Persist cart to localStorage so it survives page refreshes
  useEffect(() => {
    localStorage.setItem('bhimaya_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "store");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStoreSettings(docSnap.data());
        } else {
          setStoreSettings({ isOpen: true, closedMessage: '' });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserLoading(false);
    });

    // Real-time products listener — reflects admin stock changes instantly
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (querySnapshot) => {
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
        // Cache products so the next page refresh shows them instantly
        try { sessionStorage.setItem('bhimaya_products', JSON.stringify(productsList)); } catch { }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeProducts();
    };
  }, []);
  if (!isOnline) {
    return <Offline />;
  }
  if (loading || userLoading || settingsLoading) {
    return <Loader />;
  }

  // Maintenance Mode Check
  if (storeSettings?.isMaintenanceMode) {
    const isAllowedAdmin = user?.email === "bhimayafoods@gmail.com" || user?.email === "ssaiprasanth333@gmail.com";
    if (!isAllowedAdmin) {
      return <Maintenance estimatedEndTime={storeSettings.maintenanceEndTime} />;
    }
  }
  return (
    <>
      <Navbar
        cartCount={cart.length}
        openCart={() => setIsCartOpen(true)}
        hasBanner={storeSettings && storeSettings.isOpen === false && !!storeSettings.closedMessage}
      />
      {storeSettings && storeSettings.isOpen === false && storeSettings.closedMessage && (
        <div id="store-closed-banner" className="bg-red-600 text-white text-center py-2 px-4 font-bold text-sm md:text-base w-full fixed top-0 left-0 z-[60]">
          🚨 {storeSettings.closedMessage}
        </div>
      )}
      <Hero />
      <TopRibbon />
      <Products
        products={products}
        cart={cart}
        addToCart={addToCart}
        increaseQuantity={increaseQuantity}
        decreaseQuantity={decreaseQuantity}
      />
      <Ribbon />
      <About />
      <Footer />
      <Cart
        cart={cart}
        products={products}
        total={total}
        delivery={delivery}
        finalTotal={finalTotal}
        isOpen={isCartOpen}
        closeCart={() => setIsCartOpen(false)}
        increaseQuantity={increaseQuantity}
        decreaseQuantity={decreaseQuantity}
        checkout={triggerCheckout}
      />

      {/* Checkout Form Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Complete Your Order</h2>
              <button onClick={() => setShowCheckoutForm(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={processOrder} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))} // only numbers allowed
                  placeholder="e.g. 9876543210"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">Please enter a valid 10-digit number. We will redirect you to WhatsApp next.</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Delivery Address</label>
                <textarea
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="e.g. 123, Main Street, City"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none transition resize-y min-h-[80px]"
                />
              </div>

              <div className="bg-orange-50 p-4 rounded mt-4 border border-orange-100">
                <div className="flex justify-between items-center font-bold text-orange-900">
                  <span>Total Amount To Pay:</span>
                  <span className="text-xl">₹{finalTotal}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition flex justify-center items-center gap-2 mt-4"
              >
                <span>Continue to WhatsApp</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;