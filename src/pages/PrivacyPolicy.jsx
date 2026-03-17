import React, { useEffect } from 'react';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 md:pt-30 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-8 text-center">Privacy Policy</h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8 animate-fadeIn">
          <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 italic">
              Disclaimer: In case of any discrepancy or difference, the English version will take precedence over the translation.
            </p>
          </section>

          <section className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              At Bhimaya Foods, we value the trust you place in us and recognize the importance of secure transactions and information privacy. This Privacy Policy describes how Bhimaya Foods (“we”, “our”, “us”) collects, uses, shares, and protects your personal data through our website: <a href="https://bhimayafoods.in/" className="text-secondary font-bold hover:underline">https://bhimayafoods.in/</a>
            </p>
            <p>
              By visiting our Platform, providing your information, or availing our products/services, you agree to the terms of this Privacy Policy, our Terms & Conditions, and applicable Indian laws regarding data protection and privacy. If you do not agree, please do not use our Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">📥 Collection of Your Information</h2>
            <p className="text-gray-700">When you use our Platform, we may collect and store the information you provide, including:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 font-medium">
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Delivery address</li>
              <li>Payment details (processed securely via third-party gateways)</li>
            </ul>
            <p className="text-gray-700">Certain actions (like placing an order) require registration. We also collect buying behavior, device info, and navigation patterns to improve our services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">⚙️ Use of Your Information</h2>
            <ul className="grid md:grid-cols-2 gap-4 text-gray-700">
              <li className="flex items-start gap-2">✅ Process and deliver orders</li>
              <li className="flex items-start gap-2">✅ Provide customer support</li>
              <li className="flex items-start gap-2">✅ Send order updates</li>
              <li className="flex items-start gap-2">✅ Improve products/services</li>
              <li className="flex items-start gap-2">✅ Offer promotions (Opt-out anytime)</li>
              <li className="flex items-start gap-2">✅ Prevent fraud & ensure security</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🔄 Sharing of Personal Data</h2>
            <p className="text-gray-700 leading-relaxed">
              We share data with delivery partners, payment gateways, and service providers for fulfillment and analytics. <strong>We do not sell your personal data.</strong> Disclosures may occur if required by law or to protect rights/prevent fraud.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
            <div>
              <h3 className="font-bold text-primary mb-2">🔐 Security</h3>
              <p className="text-sm text-gray-600">We maintain reasonable security measures to protect your data, though no transmission is 100% secure.</p>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-2">🧾 Your Rights</h3>
              <p className="text-sm text-gray-600">You have the right to access, update, or request deletion of your information. Contact us to make a request.</p>
            </div>
          </section>

          <section className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-center">
            <h2 className="text-xl font-bold text-primary mb-2">🏢 Contact Information</h2>
            <p className="font-bold text-gray-800">Bhimaya Foods</p>
            <p className="text-gray-600">📍 Tippanagunta  Krishna(dist)  Andhra Pradesh, India</p>
            <p className="text-gray-600">📧 Email: <a href="mailto:bhimayafoods@gmail.com" className="text-secondary font-bold">bhimayafoods@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
