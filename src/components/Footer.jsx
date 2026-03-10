function Footer() {
  return (
    <footer id="contact" className="bg-primary text-white py-16">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">
        <div>
          <h3 className="text-2xl font-bold mb-4">BHIMAYA FOODS</h3>
          <p>Spreading joy through flavors.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <a href="#home" className="block hover:text-secondary">Home</a>
          <a href="#products" className="block hover:text-secondary">Products</a>
          <a href="#about" className="block hover:text-secondary">About Us</a>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Reach Us</h4>
          <p>
            Email: <a href="mailto:bhimayafoods@gmail.com" className="hover:text-secondary transition">bhimayafoods@gmail.com</a>
          </p>
          <p>
            WhatsApp: <a href="https://wa.me/919493023030" className="hover:text-secondary transition">+91 9493023030</a>
          </p>
        </div>
      </div>

      <div className="text-center mt-10 text-sm opacity-70 space-y-2">
        <p>FSSAI no : 20126121000164</p>
        <p>© 2026 Bhimaya Foods. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;