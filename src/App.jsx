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
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const [validStateForPincode, setValidStateForPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("whatsapp"); // 'whatsapp' initialized

  const WHATSAPP_NUMBER = "919493023030";

  const addToCart = (product, weight = "1000gm", price) => {
    const isOutOfStock =
      product.quantity?.toLowerCase().includes('out of stock') ||
      product.description?.toLowerCase().includes('out of stock') ||
      product.quantity === '0';

    if (isOutOfStock) return alert("Sorry, this item is out of stock.");

    const itemPrice = price || product.price;
    const cartItemId = `${product.id}_${weight}`;
    const existing = cart.find((item) => String(item.cartItemId) === String(cartItemId));

    if (existing) {
      setCart(cart.map(item =>
        String(item.cartItemId) === String(cartItemId)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, cartItemId, weight, price: itemPrice, quantity: 1 }]);
    }

    // setIsCartOpen(true); // User requested to disable auto-open
  };

  const increaseQuantity = (cartItemId) => {
    const cartItemIdStr = String(cartItemId);
    const productId = cartItemIdStr.split('_')[0];
    const product = products.find(p => String(p.id) === productId);
    const isOutOfStock =
      product?.quantity?.toLowerCase().includes('out of stock') ||
      product?.description?.toLowerCase().includes('out of stock') ||
      product?.quantity === '0';
    if (isOutOfStock) return alert("Sorry, this item is currently out of stock and cannot be increased.");
    setCart(cart.map(item =>
      String(item.cartItemId) === cartItemIdStr
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ));
  };

  const decreaseQuantity = (cartItemId) => {
    const cartItemIdStr = String(cartItemId);
    const item = cart.find(i => String(i.cartItemId) === cartItemIdStr);

    if (item.quantity === 1) {
      setCart(cart.filter(i => String(i.cartItemId) !== cartItemIdStr));
    } else {
      setCart(cart.map(i =>
        String(i.cartItemId) === cartItemIdStr
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const DELIVERY_CHARGE = 50;
  const FREE_LIMIT = storeSettings?.freeDeliveryLimit || 499;

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

  // Auto-fill City/State based on Pincode
  useEffect(() => {
    const lookupPincode = async () => {
      if (customerPincode.length === 6) {
        setPincodeLoading(true);
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${customerPincode}`);
          const data = await response.json();

          if (data[0].Status === "Success") {
            const info = data[0].PostOffice[0];
            // Auto-fill City if not already typed or if it's different
            if (!customerCity) setCustomerCity(info.Block || info.District);

            // Map API state names to our dropdown names if necessary
            const apiState = info.State;
            setCustomerState(apiState);
            setValidStateForPincode(apiState);
          } else {
            setValidStateForPincode("");
          }
        } catch (error) {
          console.error("Pincode lookup failed:", error);
          setValidStateForPincode("");
        } finally {
          setPincodeLoading(false);
        }
      } else {
        setValidStateForPincode("");
      }
    };
    lookupPincode();
  }, [customerPincode]);

  const generateOrderID = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${num}`;
  };

  const processOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !customerCity.trim() || !customerState.trim() || !customerPincode.trim()) {
      return alert("Please fill in all details including City, State, and Pincode.");
    }

    // Pincode and State validation
    if (customerPincode.length === 6 && validStateForPincode && customerState !== validStateForPincode) {
      return alert(`The entered pincode (${customerPincode}) is for ${validStateForPincode}, but you have selected ${customerState}. Please correct it to proceed.`);
    }

    // Snapshot cart and form values before any async/state operations
    const cartSnapshot = [...cart];
    const nameSnapshot = customerName.trim();
    const phoneSnapshot = customerPhone.trim();
    // Prevent truncation by normalizing all types of linebreaks into commas
    const addressSnapshot = customerAddress.replace(/(\r\n|\n|\r)/gm, ", ").trim();
    const citySnapshot = customerCity.trim();
    const stateSnapshot = customerState.trim();
    const pincodeSnapshot = customerPincode.trim();
    const orderID = generateOrderID();

    // Construct the WhatsApp message
    let messageText = `*Order ID: ${orderID}*\n\n`;
    messageText += `*Order from Bhimaya Foods*\n`;
    messageText += `*Customer:* ${nameSnapshot}\n`;
    messageText += `*Phone:* ${phoneSnapshot}\n`;
    messageText += `*Address:* ${addressSnapshot}, ${citySnapshot}, ${stateSnapshot} - ${pincodeSnapshot}\n\n`;
    cartSnapshot.forEach(item => {
      const weightLabel = item.weight ? ` (${item.weight})` : "";
      messageText += `• ${item.name}${weightLabel} (x${item.quantity}) - ₹${item.price * item.quantity}\n`;
    });
    if (delivery > 0) {
      messageText += `\n*Subtotal: ₹${total}*`;
      messageText += `\n*Delivery Charge: ₹${delivery}*`;
    } else {
      messageText += `\n*Free Delivery !*`;
    }
    messageText += `\n*Total: ₹${finalTotal}*`;

    const encodedMessage = encodeURIComponent(messageText);

    setIsProcessingOrder(true);
    // DEBUG ALERT
    alert("🔍 Step 1: Attempting to save order to Firestore...");
    
    // Save customer and order to Firestore
    try {
      const customerDocRef = doc(db, "customers", phoneSnapshot);
      const customerDoc = await getDoc(customerDocRef);

      if (customerDoc.exists()) {
        const data = customerDoc.data();
        await updateDoc(customerDocRef, {
          name: nameSnapshot,
          address: addressSnapshot,
          city: citySnapshot,
          state: stateSnapshot,
          pincode: pincodeSnapshot,
          totalOrders: (data.totalOrders || 0) + 1,
          lastOrderDate: serverTimestamp()
        });
      } else {
        await setDoc(customerDocRef, {
          name: nameSnapshot,
          phone: phoneSnapshot,
          address: addressSnapshot,
          city: citySnapshot,
          state: stateSnapshot,
          pincode: pincodeSnapshot,
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
        customerCity: citySnapshot,
        customerState: stateSnapshot,
        customerPincode: pincodeSnapshot,
        items: cartSnapshot.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight || '',
          image: item.image || ''
        })),
        subtotal: total,
        deliveryCharge: delivery,
        totalAmount: finalTotal,
        status: 'Pending',
        paymentStatus: 'Pending',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "orders"), orderData);
      // DEBUG ALERT
      alert(`✅ Step 2: Firestore write successful!\nDocument ID: ${docRef.id}\n\nOpening WhatsApp...`);

      // ✅ SUCCESS: ONLY NOW open WhatsApp and clear UI
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
        "_blank"
      );

      setCart([]);
      setShowCheckoutForm(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerCity("");
      setCustomerState("");
      setCustomerPincode("");
      
      alert(`🎉 Order #${orderID} placed successfully! We've opened WhatsApp for you to confirm the order.`);

    } catch (error) {
      console.error("Error saving order:", error);
      alert(`❌ Ops! We couldn't save your order to the database.\n\nError: ${error.message || "Connection issue"}\n\nPlease try again or contact us directly.`);
    } finally {
      setIsProcessingOrder(false);
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

  // Prevent background scrolling when cart or checkout form is open
  useEffect(() => {
    if (isCartOpen || showCheckoutForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen, showCheckoutForm]);

  // Razorpay Button Script Injection
  useEffect(() => {
    if (showCheckoutForm && paymentMethod === "online") {
      const container = document.getElementById("rzp-button-container");
      if (container && !container.hasChildNodes()) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/payment-button.js";
        // PLACEHOLDER BUTTON ID - User can replace this later
        script.setAttribute("data-payment_button_id", "pl_placeholder_id");
        script.async = true;
        container.appendChild(script);
      }
    }
  }, [showCheckoutForm, paymentMethod]);
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
        freeDeliveryLimit={FREE_LIMIT}
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
                  placeholder="Flat No, Apartment, Street name"
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none transition resize-y min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="City"
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Pincode</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      maxLength="6"
                      value={customerPincode}
                      onChange={(e) => setCustomerPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit"
                      className={`w-full p-3 border rounded focus:ring-2 focus:ring-orange-500 outline-none transition ${pincodeLoading ? 'bg-gray-50 border-orange-200' : 'border-gray-300'}`}
                    />
                    {pincodeLoading && (
                      <div className="absolute right-3 top-3.5">
                        <svg className="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">State</label>
                <select
                  required
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none transition bg-white"
                >
                  <option value="">Select State</option>
                  {[
                    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
                    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
                    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
                    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
                    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
                    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
                  ].map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className="bg-orange-50 p-4 rounded mt-4 border border-orange-100">
                <div className="flex justify-between items-center font-bold text-orange-900">
                  <span>Total Amount To Pay:</span>
                  <span className="text-xl">₹{finalTotal}</span>
                </div>
              </div>

              {/* Payment Method Selection - Temporarily Hidden per user request */}
              {/* 
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition hover:bg-orange-50" onClick={() => setPaymentMethod("whatsapp")}>
                  <input type="radio" checked={paymentMethod === "whatsapp"} onChange={() => setPaymentMethod("whatsapp")} className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Cash on Delivery / Manual Payment</p>
                    <p className="text-xs text-gray-500">Confirm order and pay via WhatsApp</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition hover:bg-orange-50" onClick={() => setPaymentMethod("online")}>
                  <input type="radio" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Pay Online Now</p>
                    <p className="text-xs text-gray-500">Secure payment via Razorpay</p>
                  </div>
                </div>
              </div>
              */}

              <button
                type="submit"
                disabled={isProcessingOrder}
                className={`w-full ${isProcessingOrder ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-3 px-4 rounded-lg transition flex justify-center items-center gap-2 mt-4 shadow-lg active:scale-95`}
              >
                {isProcessingOrder ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Saving Order...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to WhatsApp</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;