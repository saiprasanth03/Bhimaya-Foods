import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar({ cartCount, openCart, hideLinks }) {

  return (
    <header
      className="sticky top-0 w-full z-[100] bg-background shadow-md border-b border-gray-100 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16 md:h-20">

        {/* Logo */}
        <div className="flex items-center h-full">
          <Link to="/" className="h-full flex items-center">
            <img
              src={logo}
              alt="Bhimaya Foods Logo"
              className="h-[100%] md:h-16 lg:h-20 object-contain transition-all duration-300"
            />
          </Link>
        </div>

        {/* Navigation */}
        {!hideLinks && (
          <nav className="hidden lg:flex space-x-8 font-medium text-gray-800">
            <Link to="/" className="hover:text-secondary transition">
              Home
            </Link>
            <a href="/#products" className="hover:text-secondary transition">
              Our Products
            </a>
            <a href="/#about" className="hover:text-secondary transition">
              Our Story
            </a>
            <Link to="/contact-us" className="hover:text-secondary transition">
              Contact
            </Link>
          </nav>
        )}

        {/* Cart Button */}
        {/* <button
          onClick={openCart}
          className="relative bg-primary text-white p-3 rounded-full hover:scale-105 transition mt-[5px]"
        >
          🛒
          <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {cartCount}
          </span>
        </button> */}
        <Link
          to="/cart"
          className="relative cursor-pointer p-3 rounded-full hover:scale-105 transition mt-[5px] flex items-center justify-center bg-primary text-white"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>

          <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {cartCount}
          </span>
        </Link>


      </div>
    </header>
  );
}

export default Navbar;
