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
import TopNotice from "./components/TopNotice";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ShippingPolicy from "./pages/ShippingPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ContactUs from "./pages/ContactUs";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";

function App() {
  // Skip loader if we already have cached products from this session
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('bhimaya_products');
    } catch { return true; }
  });
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bhimaya_settings');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
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

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "online"
  });
  const [checkoutStep, setCheckoutStep] = useState(1);

  const [validStateForPincode, setValidStateForPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(""); // "", "loading", "success", "error", "not_found"
  const [settingsLoading, setSettingsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const WHATSAPP_NUMBER = "919493023030";

  const WEIGHT_FACTORS = {
    "250gm": 0.25,
    "500gm": 0.5,
    "1000gm": 1
  };

  // Sync cart prices with live product data
  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      let changed = false;
      const updatedCart = cart.map(item => {
        const liveProduct = products.find(p => String(p.id) === String(item.id));
        if (liveProduct) {
          const factor = WEIGHT_FACTORS[item.weight] || 1;
          const currentPrice = Math.round(parseFloat(liveProduct.price) * factor);
          if (item.price !== currentPrice) {
            changed = true;
            return { ...item, price: currentPrice };
          }
        }
        return item;
      });

      if (changed) {
        setCart(updatedCart);
      }
    }
  }, [products]);

  const addToCart = (product, weight = "1000gm", price) => {
    const isOutOfStock =
      product.quantity?.toLowerCase().includes('out of stock') ||
      product.description?.toLowerCase().includes('out of stock') ||
      product.quantity === '0';

    if (storeSettings?.isOpen === false) {
      return alert(storeSettings.closedMessage || "Sorry, we are currently closed and not accepting orders.");
    }

    if (isOutOfStock) return alert("Sorry, this item is out of stock.");

    const factor = WEIGHT_FACTORS[weight] || 1;
    const itemPrice = Math.round(parseFloat(product.price) * factor);
    const cartItemId = `${product.id}_${weight}`;
    const existing = cart.find((item) => String(item.cartItemId) === String(cartItemId));

    if (existing) {
      setCart(cart.map(item =>
        String(item.cartItemId) === String(cartItemId)
          ? { ...item, quantity: item.quantity + 1, price: itemPrice }
          : item
      ));
    } else {
      setCart([...cart, { ...product, cartItemId, weight, price: itemPrice, quantity: 1 }]);
    }

    // setIsCartOpen(true); // User requested to disable auto-open
  };

  const increaseQuantity = (cartItemId) => {
    const cartItemIdStr = String(cartItemId);
    const parts = cartItemIdStr.split('_');
    const productId = parts[0];
    const weight = parts[1] || "1000gm";
    
    const product = products.find(p => String(p.id) === productId);
    const isOutOfStock =
      product?.quantity?.toLowerCase().includes('out of stock') ||
      product?.description?.toLowerCase().includes('out of stock') ||
      product?.quantity === '0';

    if (isOutOfStock) return alert("Sorry, this item is currently out of stock and cannot be increased.");
    
    const factor = WEIGHT_FACTORS[weight] || 1;
    const itemPrice = product ? Math.round(parseFloat(product.price) * factor) : null;

    setCart(cart.map(item =>
      String(item.cartItemId) === cartItemIdStr
        ? { ...item, quantity: item.quantity + 1, price: itemPrice || item.price }
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
  const FREE_LIMIT = storeSettings?.freeDeliveryLimit || 999;
  const COD_FEE = 9;

  const delivery = total >= FREE_LIMIT ? 0 : DELIVERY_CHARGE;
  const isCheckoutPage = location.pathname === '/checkout';
  const codLimit = storeSettings?.codLimit || 299;
  const codFee = (isCheckoutPage && checkoutStep === 3 && customerDetails.paymentMethod === 'whatsapp' && total <= codLimit) ? COD_FEE : 0;
  const finalTotal = total + delivery + codFee;

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => String(item.cartItemId) !== String(cartItemId)));
  };

  // Auto-fill City/State based on Pincode
  useEffect(() => {
    let isCancelled = false;
    const lookupPincode = async () => {
      const pin = customerDetails.pincode;
      
      if (pin.length !== 6) {
        setValidStateForPincode("");
        setPincodeStatus("");
        return;
      }

      setPincodeLoading(true);
      setPincodeStatus("loading");
      
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        if (!response.ok) throw new Error("Network Response Fail");
        const data = await response.json();

        if (isCancelled) return;

        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const info = data[0].PostOffice[0];
          const apiState = info.State;
          const apiCity = info.Block || info.District;
          
          setCustomerDetails(prev => ({
            ...prev,
            city: prev.city || apiCity,
            state: prev.state || apiState
          }));
          setValidStateForPincode(apiState);
          setPincodeStatus("success");
        } else {
          setValidStateForPincode("");
          setPincodeStatus("not_found");
        }
      } catch (error) {
        if (isCancelled) return;
        console.error("Pincode lookup failed:", error);
        setValidStateForPincode("");
        setPincodeStatus("error");
      } finally {
        if (!isCancelled) setPincodeLoading(false);
      }
    };

    lookupPincode();
    return () => { isCancelled = true; };
  }, [customerDetails.pincode]);

  const generateOrderID = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${num}`;
  };

  const processOrder = async (e) => {
    if (e) e.preventDefault();
    
    if (storeSettings?.isOpen === false) {
      return alert(storeSettings.closedMessage || "Sorry, we are currently closed and not accepting orders.");
    }
    
    const { name, phone, address, city, state, pincode, paymentMethod } = customerDetails;

    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      return alert("Please fill in all details including City, State, and Pincode.");
    }

    // Pincode and State validation (Non-blocking)
    if (pincode.length !== 6) {
      return alert("Please enter a valid 6-digit pincode.");
    }

    // Snapshot cart and form values before any async/state operations
    const cartSnapshot = [...cart];
    const nameSnapshot = name.trim();
    const phoneSnapshot = phone.trim();
    const addressSnapshot = address.replace(/(\r\n|\n|\r)/gm, ", ").trim();
    const citySnapshot = city.trim();
    const stateSnapshot = state.trim();
    const pincodeSnapshot = pincode.trim();
    const orderID = generateOrderID();

    // Construct the WhatsApp message
    let messageText = `*Order ID: ${orderID}*\n\n`;
    messageText += `*Order from Bhimaya Foods*\n`;
    messageText += `*Customer:* ${nameSnapshot}\n`;
    messageText += `*Phone:* ${phoneSnapshot}\n`;
    messageText += `*Address:* ${addressSnapshot}, ${citySnapshot}, ${stateSnapshot} - ${pincodeSnapshot}\n`;
    messageText += `*Payment Method:* ${paymentMethod === 'whatsapp' ? 'COD (Manual Pay)' : 'Online'}\n\n`;
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
    
    if (codFee > 0) {
      messageText += `\n*Platform Fee (COD): ₹${codFee}*`;
    }
    
    messageText += `\n*Total: ₹${finalTotal}*`;

    const encodedMessage = encodeURIComponent(messageText);

    setIsProcessingOrder(true);
    
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
          weight: item.weight || ''
        })),
        subtotal: total,
        deliveryCharge: delivery,
        totalAmount: finalTotal,
        paymentMethod: paymentMethod,
        status: 'Pending',
        paymentStatus: 'Pending',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "orders"), orderData);

      // Redirect all payments to WhatsApp for now as requested
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
        "_blank"
      );

      setCart([]);
      setCustomerDetails({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        paymentMethod: "online"
      });
      setCheckoutStep(1);
      navigate('/');
      
    } catch (error) {
      console.error("Error saving order:", error);
      alert(`❌ Oops! We couldn't save your order to the database.\n\nError: ${error.message || "Connection issue"}\n\nPlease try again or contact us directly.`);
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
          const data = docSnap.data();
          setStoreSettings(data);
          try { localStorage.setItem('bhimaya_settings', JSON.stringify(data)); } catch { }
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

  // Prevent background scrolling when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  // Razorpay Button Script Injection (Moved to CheckoutPage if needed, or removed here)
  useEffect(() => {
    if (customerDetails.paymentMethod === "online") {
      const container = document.getElementById("rzp-button-container");
      if (container && !container.hasChildNodes()) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/payment-button.js";
        script.setAttribute("data-payment_button_id", "pl_placeholder_id");
        script.async = true;
        container.appendChild(script);
      }
    }
  }, [customerDetails.paymentMethod]);
  if (!isOnline) {
    return <Offline />;
  }
  // Improved performance: Show app immediately if products are cached
  const isEssentialDataLoading = (loading && products.length === 0);
  
  if (isEssentialDataLoading) {
    return <Loader />;
  }
  
  // Maintenance Mode Check
  if (storeSettings?.isMaintenanceMode) {
    const isAllowedAdmin = user?.email === "bhimayafoods@gmail.com" || user?.email === "ssaiprasanth333@gmail.com";
    if (!isAllowedAdmin) {
      return <Maintenance estimatedEndTime={storeSettings.maintenanceEndTime} />;
    }
  }
  const isAdmin = user?.email === "bhimayafoods@gmail.com" || user?.email === "ssaiprasanth333@gmail.com";

   const isStoreClosed = storeSettings && storeSettings.isOpen === false && !!storeSettings.closedMessage;
   const showTopNotice = !!(storeSettings?.showTopInfo && storeSettings?.topInfoMessage);

   return (
     <div className={isAdmin ? "selection-enabled" : ""}>
       <TopNotice 
         message={storeSettings?.topInfoMessage} 
         isVisible={storeSettings?.showTopInfo} 
       />
       {isStoreClosed && (
         <div id="store-closed-banner" className="bg-red-600 text-white text-center py-2 px-4 font-bold text-sm md:text-base w-full relative z-[60]">
           🚨 {storeSettings.closedMessage}
         </div>
       )}
       <Navbar
         cartCount={cart.length}
         openCart={() => setIsCartOpen(true)}
         hideLinks={['/cart', '/checkout'].includes(location.pathname)}
       />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
             <TopRibbon />
            <Products
              products={products}
              cart={cart}
              addToCart={addToCart}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              isStoreOpen={storeSettings?.isOpen !== false}
            />
            <Ribbon />
            <About />
          </>
        } />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsAndConditions />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/cart" element={
          <CartPage 
            cart={cart}
            products={products}
            total={total}
            delivery={delivery}
            finalTotal={finalTotal}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            removeFromCart={removeFromCart}
            checkout={() => navigate('/checkout')}
            isStoreOpen={storeSettings?.isOpen !== false}
          />
        } />
        <Route path="/checkout" element={
          <CheckoutPage
            cart={cart}
            total={total}
            delivery={delivery}
            codFee={codFee}
            finalTotal={finalTotal}
            processOrder={processOrder}
            isProcessingOrder={isProcessingOrder}
            customerDetails={customerDetails}
            setCustomerDetails={setCustomerDetails}
            pincodeLoading={pincodeLoading}
            pincodeStatus={pincodeStatus}
            validStateForPincode={validStateForPincode}
            codLimit={codLimit}
            COD_FEE={9}
            step={checkoutStep}
            setStep={setCheckoutStep}
            isStoreOpen={storeSettings?.isOpen !== false}
          />
        } />
      </Routes>
      {!['/cart', '/checkout'].includes(location.pathname) && <Footer />}

      {/* Floating WhatsApp Button - Hidden on Cart and Checkout pages */}
      {!['/cart', '/checkout'].includes(location.pathname) && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all hover:scale-110 active:scale-95 group"
          aria-label="Contact on WhatsApp"
        >
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          {/* Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Contact Us
          </span>
        </a>
      )}
    </div>
  );
}

export default App;