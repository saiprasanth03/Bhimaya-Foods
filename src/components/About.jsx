import aboutImg from "../assets/bottomimg.jpeg";

function About() {
  return (
    <section id="about" className="py-16 bg-yellow-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="flex flex-col xs:flex-row items-center gap-12">

          {/* Image */}
          <div className="w-full xs:w-1/2">
            <img
              src={aboutImg}
              alt="Snack"
              className="w-full rounded-3xl shadow-lg object-cover"
            />
          </div>

          {/* Text */}
          <div className="w-full xs:w-1/2">
            <h2 className="text-3xl md:text-4xl font-playfair text-primary mb-6">
              Our Story
            </h2>

            <p className="text-gray-600 mb-4 leading-relaxed">
              {/* At Bhimaya Foods, we preserve authentic Indian flavors
              while maintaining highest quality standards. */}
              Namaste! I’m Kalapala Rohit, a student with a simple dream — to build something of my own. This year, my mother and I decided to turn that dream into reality. My mother cooks with love, and her food feels like home — warm, comforting, and full of tradition.
So we started a small homemade food venture together. Every dish is fresh and made with care. When you support us, you are not just buying food — you are supporting a mother and son chasing a dream. ❤️
            </p>

            <p className="text-gray-600 leading-relaxed">
              {/* Every snack celebrates heritage and handpicked ingredients. */}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default About;