import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Jammu and Kashmir",
];

const ProgressBar = ({ step, steps }) => (
  <div className="bg-white border-b sticky top-16 md:top-20 z-30 py-4 shadow-sm mb-6">
    <div className="max-w-3xl mx-auto px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-blue-600 transition-all duration-300 -translate-y-1/2 z-0"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        {steps.map((s) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                step > s.id ? 'bg-blue-600 text-white' :
                step === s.id ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s.id ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : s.id}
            </div>
            <span className={`mt-2 text-[10px] md:text-xs font-bold uppercase transition-colors duration-300 ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CheckoutPage = ({
  cart,
  total,
  delivery,
  codFee,
  finalTotal,
  processOrder,
  isProcessingOrder,
  customerDetails,
  setCustomerDetails,
  // eslint-disable-next-line no-unused-vars
  pincodeLoading: _pincodeLoading,
  // eslint-disable-next-line no-unused-vars
  pincodeStatus: _pincodeStatus,

  validStateForPincode,
  codLimit,
  COD_FEE,
  step,
  setStep,
  isStoreOpen
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (total > codLimit && customerDetails.paymentMethod === 'whatsapp') {
      setCustomerDetails(prev => ({ ...prev, paymentMethod: 'online' }));
    }
  }, [total, codLimit, customerDetails.paymentMethod, setCustomerDetails]);

  const steps = [
    { id: 1, name: 'Address' },
    { id: 2, name: 'Order Summary' },
    { id: 3, name: 'Payment' }
  ];

  const handleNext = (e) => {
    if (e) e.preventDefault();
    
    if (step === 1) {
      const { pincode } = customerDetails;
      if (pincode.length !== 6) {
        return alert("Please enter a valid 6-digit pincode.");
      }
      
      // Removed all blocking pincode/state validation alerts
    }

    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 mt-16 md:mt-20 flex flex-col">
      <ProgressBar step={step} steps={steps} />
      
      <div className="max-w-6xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            
            {/* STEP 1: ADDRESS */}
            {step === 1 && (
              <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Delivery Address</h2>
                <form onSubmit={handleNext} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        name="name"
                        value={customerDetails.name}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        name="phone"
                        value={customerDetails.phone}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                        placeholder="10-digit mobile number"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Detailed Address</label>
                    <textarea
                      required
                      name="address"
                      value={customerDetails.address}
                      onChange={handleChange}
                      placeholder="Flat, House no., Building, Apartment"
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition resize-none h-24"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Pincode</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          pattern="[0-9]{6}"
                          maxLength="6"
                          name="pincode"
                          value={customerDetails.pincode}
                          onChange={(e) => setCustomerDetails(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                          placeholder="6-digit"
                          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">City</label>
                      <input
                        type="text"
                        required
                        name="city"
                        value={customerDetails.city}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">State</label>
                      <select
                        required
                        name="state"
                        value={customerDetails.state}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded outline-none transition text-gray-800 bg-white ${
                          validStateForPincode && customerDetails.state.trim().toLowerCase() !== validStateForPincode.toLowerCase() 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </form>
              </div>
            )}

            {/* STEP 2: SUMMARY */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 uppercase text-sm tracking-widest">Order Summary</h2>
                  </div>
                  
                  {/* Address Summary Block */}
                  <div className="bg-blue-50/30 p-4 border border-blue-100 rounded mb-6 flex justify-between items-start">
                    <div>
                       <p className="font-bold text-gray-900">{customerDetails.name} <span className="ml-2 px-2 py-0.5 bg-gray-200 text-[10px] rounded uppercase">Home</span></p>
                       <p className="text-sm text-gray-600 mt-1">{customerDetails.address}, {customerDetails.city}, {customerDetails.state} - {customerDetails.pincode}</p>
                       <p className="font-bold text-sm mt-1">{customerDetails.phone}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-blue-600 font-bold border border-blue-200 px-4 py-1.5 rounded bg-white hover:bg-blue-50 transition text-sm">
                      Change
                    </button>
                  </div>

                  {/* Items list */}
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.cartItemId} className="flex gap-4 border-b pb-6 last:border-b-0">
                         <div className="w-20 h-20 flex-shrink-0 border border-gray-100 p-1">
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                         </div>
                         <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{item.name} ({item.weight})</h3>
                            <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                            <p className="text-lg font-bold mt-2">₹{item.price * item.quantity}</p>
                         </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT */}
            {step === 3 && (
              <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase text-sm tracking-widest">Payment Options</h2>
                
                <div className="space-y-4">
                    <div 
                      className={`flex items-start gap-4 p-6 border-2 rounded-lg transition ${
                        total > codLimit 
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                          : customerDetails.paymentMethod === 'whatsapp' 
                            ? 'border-orange-500 bg-orange-50/50 cursor-pointer' 
                            : 'border-gray-100 hover:border-orange-200 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (total <= codLimit) {
                          setCustomerDetails(prev => ({ ...prev, paymentMethod: 'whatsapp' }));
                        }
                      }}
                    >
                      <div className={`w-5 h-5 mt-1 rounded-full border-2 flex items-center justify-center ${
                        total > codLimit 
                          ? 'border-gray-200' 
                          : customerDetails.paymentMethod === 'whatsapp' 
                            ? 'border-orange-500 ring-2 ring-orange-200' 
                            : 'border-gray-300'
                      }`}>
                         {customerDetails.paymentMethod === 'whatsapp' && total <= codLimit && <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>}
                      </div>
                      <div className="flex-1">
                         <p className={`font-bold ${total > codLimit ? 'text-gray-400' : 'text-gray-800'}`}>WhatsApp Checkout (COD / Manual Pay)</p>
                         {total > codLimit ? (
                           <p className="text-xs text-red-500 mt-1 font-bold italic">
                             ⚠️ COD unavailable for orders above ₹{codLimit}. Please use Online Payment.
                           </p>
                         ) : (
                           <>
                             <p className="text-sm text-gray-500 mt-1 text-green-600 font-medium font-mono">Confirm order details via WhatsApp</p>
                             <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                               ₹{COD_FEE} platform fee applies for COD
                             </p>
                           </>
                         )}
                      </div>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className={`w-10 h-10 ${total > codLimit ? 'grayscale opacity-30' : ''}`} />
                    </div>

                  {/* Razorpay Option - Placeholder style */}
                  <div 
                    className={`flex items-center gap-4 p-6 border-2 rounded-lg cursor-pointer transition ${customerDetails.paymentMethod === 'online' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-orange-200 opacity-80'}`}
                    onClick={() => setCustomerDetails(prev => ({ ...prev, paymentMethod: 'online' }))}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${customerDetails.paymentMethod === 'online' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-300'}`}>
                       {customerDetails.paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>}
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-800">Online Payment</p>
                       <p className="text-sm text-gray-400 mt-1">UPI, Credit/Debit cards, NetBanking</p>
                    </div>
                    <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="w-8 h-8 rounded" />
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: PRICE DETAILS */}
          <div className="lg:col-span-4 sticky top-36">
             <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden text-[#000]">
                <div className="p-4 border-b">
                   <h3 className="text-gray-500 font-bold uppercase text-[12px] tracking-[0.1em]">PRICE DETAILS</h3>
                </div>
                
                <div className="p-5 space-y-6">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center text-[15px]">
                       <span className="text-gray-800">Price</span>
                       <span className="text-gray-900 font-medium">₹{total}</span>
                    </div>
                    <span className="text-[12px] text-gray-500">({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-gray-800">Delivery Charges</span>
                    <span className={delivery === 0 ? "text-green-600 font-bold uppercase" : "text-gray-900 font-medium"}>
                       {delivery === 0 ? "FREE" : `₹${delivery}`}
                    </span>
                  </div>

                  {codFee > 0 && total <= codLimit && (
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-orange-700 font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        Platform Fee (COD)
                      </span>
                      <span className="font-medium text-gray-900">₹{codFee}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center border-t border-dashed pt-5 font-bold text-lg text-[#000] mt-2">
                    <span className="text-[17px]">Total Amount</span>
                    <span className="text-[17px]">₹{finalTotal}</span>
                  </div>
                </div>
                
                <div className="p-4 border-t border-dashed bg-green-50/20">
                   <p className="text-green-700 font-bold text-[11px] flex items-center gap-2 uppercase tracking-wide">
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                     100% SECURE CHECKOUT
                   </p>
                </div>
             </div>

             {/* COD LIMIT WARNING - Visibile on all steps if exceeded */}
             {total > codLimit && (
                <div className="mt-4 text-red-600 text-[11px] font-bold bg-red-50 p-3.5 rounded border border-red-100 animate-fadeIn flex items-start gap-2 shadow-sm leading-relaxed">
                   <span>⚠️</span>
                   <span>Cash on Delivery (COD) is not available for orders above ₹{codLimit}. Please use Online Payment.</span>
                </div>
             )}

             {/* CTA BUTTONS */}
             <div className="flex flex-col gap-3 mt-6">
                {step === 1 && (
                  <button 
                    onClick={() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                    }}
                    className="w-full bg-[#fb641b] text-white py-4 rounded font-extrabold uppercase shadow-sm hover:brightness-95 transition active:scale-[0.98] tracking-widest text-[14px]"
                  >
                    SAVE AND CONTINUE
                  </button>
                )}
                {step === 2 && (
                  <button 
                    onClick={handleNext}
                    className="w-full bg-[#fb641b] text-white py-4 rounded font-extrabold uppercase shadow-sm hover:brightness-95 transition active:scale-[0.98] tracking-widest text-[14px]"
                  >
                    CONTINUE TO PAYMENT
                  </button>
                )}
                {step === 3 && (
                  <button 
                     onClick={() => isStoreOpen && processOrder()}
                     disabled={isProcessingOrder || !isStoreOpen}
                     className={`w-full ${isProcessingOrder || !isStoreOpen ? 'bg-gray-400' : 'bg-[#fb641b] hover:brightness-95'} text-white py-4 rounded font-extrabold uppercase shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2 tracking-widest text-[14px]`}
                  >
                    {isProcessingOrder ? (
                       <>
                         <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                         <span>PLACING ORDER...</span>
                       </>
                    ) : !isStoreOpen ? (
                      'STORE CLOSED'
                    ) : (
                      'CONFIRM & PLACE ORDER'
                    )}
                  </button>
                )}

                {step > 1 && (
                  <button 
                    onClick={handleBack}
                    className="w-full bg-white text-gray-500 py-3 rounded font-bold border border-gray-200 hover:bg-gray-50 transition uppercase text-[11px] tracking-wider"
                  >
                    Go Back
                  </button>
                )}
             </div>

             <div className="flex flex-col items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase mt-6 opacity-70 text-center tracking-tighter">
                <p className="flex items-center gap-1.5 justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  SAFE AND SECURE PAYMENTS.
                </p>
                <p>100% AUTHENTIC PRODUCTS.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
