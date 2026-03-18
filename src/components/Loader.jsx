// function Loader() {
//   return (
//     <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
//       <div className="flex flex-col items-center gap-4">
//         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
//         <p className="text-primary font-semibold">Loading Bhimaya Foods...</p>
//       </div>
//     </div>
//   );
// }

// export default Loader;




import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

function Loader() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReload(true);
    }, 10000); // Show reload button if loading for more than 10 seconds
    return () => clearTimeout(timer);
  }, []);

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

        {showReload && (
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-xs font-bold hover:scale-105 transition shadow-lg flex items-center gap-2"
          >
            <span>Still loading? Refresh Page</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        )}

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