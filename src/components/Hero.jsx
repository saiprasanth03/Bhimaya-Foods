import heroImg from "../assets/sweet_snack_1.png";

function Hero() {
  return (
    <section
      id="home"
      className="h-screen flex items-center justify-center bg-cover bg-center text-white"
      style={{
        backgroundImage:
          `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImg})`,
      }}
    >
      <div className="text-center max-w-3xl px-6">
        <h1 className="text-5xl md:text-6xl font-playfair mb-6 leading-tight">
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