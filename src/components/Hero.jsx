import heroImg from "../assets/home.jpeg";

function Hero() {
  return (
    <section
      id="home"
      className="min-h-[70vh] md:h-screen flex items-center justify-center bg-cover bg-center text-white -mt-16 md:-mt-20"
      style={{
        backgroundImage:
          `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${heroImg})`,
      }}
    >
      <div className="text-center max-w-3xl px-6 py-12 md:py-0">
        <h1 className="text-4xl md:text-6xl font-playfair mb-4 md:mb-6 leading-tight">
          Welcome To{" "}<br/>
          <span className="text-secondary">BHIMAYA FOODS</span>
        </h1>

        <p className="mb-8 text-lg">
          Experience the Best Homemade Foods
        </p>

        <div className="space-x-4">
          <a
            href="#products"
            className="bg-primary px-8 py-3 rounded-full hover:scale-105 transition"
          >
            Shop Now
          </a>
          <a
            href="#about"
            className="bg-secondary px-8 py-3 rounded-full hover:scale-105 transition"
          >
            Our Story
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;