import logo from "../assets/logo.png";

function Loader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-8">

        {/* Logo */}
        <img
          src={logo}
          alt="Bhimaya Foods"
          className="h-16 md:h-20 object-contain"
        />

        {/* Smooth loading line */}
        <div className="w-48 h-[3px] bg-gray-200 overflow-hidden rounded-full">
          <div className="h-full w-1/2 bg-primary animate-[loading_1.2s_ease-in-out_infinite]"></div>
        </div>

      </div>

      {/* Custom animation */}
      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>
    </div>
  );
}

export default Loader;