import React, { useEffect } from 'react';

const ContactUs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 md:pt-30 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">📞 Contact Us</h1>
        <p className="text-xl text-gray-700 mb-12">Bhimaya Foods – We’re here to help!</p>
        
        <div className="grid md:grid-cols-2 gap-8 text-left animate-fadeIn">
          {/* Email Support */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-primary">
            <div className="text-3xl mb-4">📩</div>
            <h2 className="text-2xl font-bold text-primary mb-4">Email Support</h2>
            <p className="text-gray-600 mb-4">For all queries, orders, or support:</p>
            <a href="mailto:bhimayafoods@gmail.com" className="text-xl font-bold text-secondary hover:underline">
              bhimayafoods@gmail.com
            </a>
            <p className="text-sm text-gray-500 mt-4 italic">We aim to respond within 24 hours.</p>
          </div>

          {/* Phone Support */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-secondary">
            <div className="text-3xl mb-4">📞</div>
            <h2 className="text-2xl font-bold text-primary mb-4">Phone Support</h2>
            <p className="text-gray-600 mb-4">Available between 9:00 AM – 7:00 PM</p>
            <a href="tel:+919493023030" className="text-xl font-bold text-secondary hover:underline">
              +91 9493023030
            </a>
            <p className="text-sm text-gray-500 mt-4 italic">Call us for orders or quick support.</p>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:col-span-2 flex flex-col md:flex-row items-center gap-6">
            <div className="text-4xl">📍</div>
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">Address</h2>
              <p className="text-gray-700 text-lg">
                Bhimaya Foods, Tippanagunta  Krishna(dist)  Andhra Pradesh, India
              </p>
            </div>
          </div>

          {/* Help Categories */}
          <div className="bg-green-50 rounded-2xl p-8 md:col-span-2 border border-green-100">
            <h3 className="text-xl font-bold text-primary mb-4">💬 You can contact us for:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700 font-medium">
              <div className="flex items-center gap-2">📦 Order status</div>
              <div className="flex items-center gap-2">🔄 Returns & refunds</div>
              <div className="flex items-center gap-2">🌾 Product info</div>
              <div className="flex items-center gap-2">🤝 Bulk orders</div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary">🤝 Stay Connected</h2>
          <p className="text-gray-600">Follow us on social media for updates, offers, and new product launches!</p>
          <div className="bg-orange-50 inline-block p-4 rounded-full text-secondary font-bold">
            💛 Thank you for choosing Bhimaya Foods!
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
