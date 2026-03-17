import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 md:pt-30 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-8 text-center font-playfair">📜 Terms & Conditions</h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8 animate-fadeIn text-gray-700 leading-relaxed">
          <section className="space-y-4">
            <p>
              Welcome to Bhimaya Foods! By accessing or using our website <Link to="/" className="text-secondary font-bold hover:underline">https://bhimayafoods.in/</Link> (the “Platform”), you agree to comply with and be bound by the following Terms & Conditions.
            </p>
            <p className="font-bold text-red-600 italic">If you do not agree, please do not use this website.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">✅ 1. Acceptance of Terms</h2>
            <p>By using our Platform, you confirm that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are at least 18 years old, or</li>
              <li>You are using the site under the supervision of a parent or guardian</li>
            </ul>
            <p>If you are using this website on behalf of a business, you confirm that you have authority to bind that business to these Terms.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🔄 2. Changes to Terms</h2>
            <p>We may update these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the website means you accept the updated Terms.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🛒 3. Product Information</h2>
            <p>At Bhimaya Foods, we strive to provide accurate product descriptions and pricing. However: Errors may occur; We do not guarantee all information is 100% accurate; We reserve the right to cancel orders due to pricing or product errors.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">💳 4. Orders & Payment</h2>
            <p><strong>📦 Order Acceptance:</strong> Your order is an offer. We may reject orders due to availability, pricing errors, or suspicious activity. You will receive confirmation via email or SMS.</p>
            <p><strong>💰 Payment:</strong> We accept UPI, Debit/Credit Cards, and Online payment gateways. By making a payment, you confirm authorized usage and provide accurate details.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🚚 5. Shipping & Delivery</h2>
            <p>Orders are processed as quickly as possible. Shipping charges are calculated at checkout. Delivery timelines may vary based on location. We are not responsible for delays caused by courier partners, natural events, or unexpected issues.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🔁 6. Return & Refund Policy</h2>
            <p><strong>📌 6.1 Eligibility:</strong> Returns accepted within 5–7 days. Unused and original packaging. <span className="text-red-600 font-bold">⚠️ Food products may not be eligible for return due to safety reasons unless defective.</span></p>
            <p><strong>📌 6.2 Return Process:</strong> Contact us at <strong>bhimayafoods@gmail.com</strong> for guidance.</p>
            <p><strong>📌 6.3 Refunds:</strong> Processed within 5–7 business days after approval to original payment method.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🧠 7. Intellectual Property</h2>
            <p>All content on this website (logo, text, images, designs) belongs to Bhimaya Foods. You may not copy, reproduce, or use any content without written permission.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🚫 8. User Conduct</h2>
            <p>By using our website, you agree NOT to: Violate laws, provide false info, upload harmful software, misuse the website, or post offensive content.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">⚠️ 9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Bhimaya Foods is not liable for indirect or incidental damages, loss of profits or data, or issues arising from product usage.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">📢 10. Disclaimer of Warranties</h2>
            <p>All products are provided “as is”. We do not guarantee products will meet every expectation or that the website will always be error-free.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">⚖️ 11. Governing Law</h2>
            <p>These Terms are governed by the laws of <strong>Andhra Pradesh, India</strong>. Disputes will be handled in courts located in <strong>Tippanagunta, Andhra Pradesh</strong>.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">✂️ 12. Severability</h2>
            <p>If any part of these Terms is found invalid, the remaining sections will still apply.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🛡️ 13. Indemnification</h2>
            <p>You agree to protect and hold harmless Bhimaya Foods from claims, damages, or legal issues arising from your misuse of the website or violation of these Terms.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🔒 14. Privacy Policy</h2>
            <p>Your use of our Platform is also governed by our <Link to="/privacy-policy" className="text-secondary font-bold hover:underline">Privacy Policy</Link>.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">📞 15. Contact Information</h2>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="font-bold">Bhimaya Foods</p>
              <p>📍 Tippanagunta Krishna(dist) Andhra Pradesh, India</p>
              <p>📧 Email: <a href="mailto:bhimayafoods@gmail.com" className="text-secondary font-bold">bhimayafoods@gmail.com</a></p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">📄 16. Entire Agreement</h2>
            <p>These Terms represent the complete agreement between you and Bhimaya Foods.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">🌪️ 17. Force Majeure</h2>
            <p>We are not responsible for delays or failure caused by events beyond our control such as natural disasters, network issues, or government actions.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-secondary">⛔ 18. Termination</h2>
            <p>We may suspend or terminate access to our website if you violate these Terms or if your activity harms our business or other users.</p>
          </section>

          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-primary font-bold">💚 Thank you for choosing Bhimaya Foods!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
