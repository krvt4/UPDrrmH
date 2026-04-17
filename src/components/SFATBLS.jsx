import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import SFATBLSQR from "../assets/SFATBLSqr.png";
import BertsImg from "../assets/SFATBLSimg.png";
import backgroundImage from "../assets/SFATBLSbg.png";
import { ChevronsRight } from "lucide-react";

function SFATBLS() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      {/* Breadcrumb */}
      <section className="mt-20 mb-2 px-4">
        <div className="flex items-start font-semibold">
          <Link to="/" className="flex items-center text-gray-500">
            Home <ChevronsRight className="text-black mx-2" size={20} />
          </Link>
          <p className="text-red-900">SFATBLS Training</p>
        </div>
      </section>

      {/* MAIN SECTION */}
      <section
        className="relative flex flex-col lg:flex-row justify-center items-stretch text-red-900 px-4 mb-8 gap-4"
      >
        {/* LEFT CONTENT */}
        <div
          className="relative lg:w-3/4 w-full p-6 rounded-2xl shadow-md bg-no-repeat bg-cover bg-center flex flex-col overflow-hidden"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          {/* Transparent Red Overlay */}
          <div className="absolute inset-0 bg-red-900/15" />

          {/* Content Wrapper */}
          <div className="relative z-10">
            {/* Title */}
            <h2 className="text-[#7a0000] font-extrabold text-3xl sm:text-5xl leading-tight">
              Standard First Aid and Basic Life Support (SFATBLS)
            </h2>

            {/* Intro glass box */}
         <div className="mt-6 rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-5">
              <p className="text-black text-base sm:text-xl text-justify leading-relaxed">
                This training aims to equip participants with critical life-saving
                skills for effective response during emergencies.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-start mt-8 gap-8">
              {/* Image */}
              <div className="w-full lg:w-[420px] flex items-center">
                <img
                  src={BertsImg}
                  alt="SFATBLS Training"
                  className="w-full max-h-[520px] object-cover rounded-2xl shadow-md"
                />
              </div>

              {/* Text Column */}
              <div className="flex-1 space-y-6">
                {/* What is SFATBLS */}
                <div className="rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-5">
                  <h2 className="text-[#7a0000] text-2xl sm:text-4xl font-extrabold uppercase mb-4">
                    What is SFATBLS?
                  </h2>

                  <p className="text-black text-base sm:text-xl text-justify leading-relaxed">
                    The Standard First Aid and Basic Life Support training equips
                    participants with the essential skills to respond to emergencies
                    with confidence and care. It includes CPR, wound care, and real-life
                    emergency simulations.
                  </p>
                </div>

                {/* What we do */}
               <div className="rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-5">
                  <h2 className="text-[#7a0000] text-2xl sm:text-4xl font-extrabold uppercase mb-4">
                    What We Do at SFATBLS?
                  </h2>

                  <ul className="text-black text-base sm:text-xl leading-relaxed list-disc ml-6 space-y-2">
                    <li>CPR and rescue breathing drills</li>
                    <li>Bleeding control and bandaging</li>
                    <li>Shock and fracture management</li>
                    <li>Scene safety and patient transport</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 bg-[#7a0000] rounded-2xl shadow-md w-full lg:w-1/3 flex flex-col">
          <div className="flex-1 flex">
            <div className="bg-[#6b1717] rounded-2xl shadow-lg w-full flex flex-col justify-center items-center text-center px-8 sm:px-10 py-10">
              {/* Icon bubble */}
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-yellow-500/20 flex items-center justify-center relative">
                  <span className="text-4xl">📅</span>
                  <span className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-yellow-500 flex items-center justify-center text-sm">
                    🔔
                  </span>
                </div>
              </div>

              <h2 className="text-3xl font-extrabold text-yellow-400 mb-4">
                Registration Opens Soon
              </h2>

              <p className="text-white/90 text-base leading-relaxed mb-8">
                Stay tuned for upcoming training schedules and fees.
              </p>

              {/* Loading dots */}
              <div className="flex justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>

          {/* COMMENTED OLD CONTENT (DO NOT DELETE) */}
          {/*
          <div className="mt-8 grid grid-cols-2 gap-6 items-center">
            <div className="flex flex-col justify-center items-center text-center space-y-3">
              <p className="text-yellow-400 text-lg sm:text-xl font-bold">
                Training Fee:
              </p>

              <div className="text-white space-y-2 text-sm sm:text-base font-medium">
                <p className="text-lg sm:text-xl">
                  PHP 7,000 <span className="opacity-90">(Participant)</span>
                </p>
              </div>

              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSe9C4GgUC6R_huvzUfzUS_ozeRkc_qRR7yevQUs3yVhcxXi5Q/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 bg-yellow-500 text-white font-semibold px-6 py-3 rounded-lg transition-transform hover:scale-105 hover:bg-yellow-600 shadow-md"
              >
                JOIN NOW!
              </a>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3">
              <p className="text-white text-sm sm:text-base text-center font-medium">
                Scan the QR Code
              </p>

              <img
                src={SFATBLSQR}
                alt="QR Code"
                className="w-32 sm:w-40 md:w-44 bg-white p-3 rounded-xl shadow-lg"
              />
            </div>
          </div>
          */}
        </div>
      </section>
    </main>
  );
}

export default SFATBLS;
