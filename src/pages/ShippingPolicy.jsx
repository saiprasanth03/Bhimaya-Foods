import React, { useEffect } from 'react';

const ShippingPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 md:pt-30 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-8 text-center">Shipping Policy</h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8 animate-fadeIn">
          <section className="space-y-4">
            <p className="text-gray-700 leading-relaxed text-center font-medium">
              Thank you for shopping at Bhimaya Foods! We are committed to delivering your orders fresh, safely, and on time across India. 🇮🇳
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">⏳ Processing Time</h2>
              <p className="text-blue-800 text-sm">
                Orders are processed within <strong>1–3 business days</strong> after payment confirmation. Weekend orders are processed on the next working day.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h2 className="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">🚀 Delivery Time</h2>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Metro Cities: <strong>3–5 business days</strong></li>
                <li>• Non-Metro Cities: <strong>5–10 business days</strong></li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">💰 Shipping Charges</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 border border-orange-200 p-4 rounded-lg bg-orange-50">
                <p className="text-gray-800 font-bold">Standard Shipping</p>
                <p className="text-2xl text-primary font-bold">₹49</p>
                <p className="text-xs text-gray-500">For orders below ₹999</p>
              </div>
              <div className="flex-1 border border-green-200 p-4 rounded-lg bg-green-50">
                <p className="text-gray-800 font-bold">Free Shipping</p>
                <p className="text-2xl text-secondary font-bold">FREE</p>
                <p className="text-xs text-gray-500">On orders above ₹999</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">📦 Shipping Methods & Tracking</h2>
            <p className="text-gray-700">We partner with trusted courier services like Shiprocket. You will receive a tracking number via SMS/Email once your order is shipped.</p>
          </section>

          <section className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h2 className="text-xl font-bold text-red-900 mb-2">⚠️ Damaged or Lost Shipments</h2>
            <p className="text-red-800 text-sm">
              If your order is damaged or missing items, please contact us within <strong>24 hours</strong> of delivery with proof.
            </p>
          </section>

          <section className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-center">
            <p className="font-bold text-primary">Shipping Support</p>
            <p className="text-gray-600">📧 Email: <a href="mailto:bhimayafoods@gmail.com" className="text-secondary font-bold">bhimayafoods@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
