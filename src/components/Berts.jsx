import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import BertsQR from "../assets/BertsMciRegisQRcode.png";
import BertsImg from "../assets/berts-img.png";
import backgroundImage from "../assets/berts-bg.png";
import { ChevronsRight } from "lucide-react";

function Trainings() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const dates = [
    "January 26-27", "April 20-21",
    "February 9-10", "May 4-5",
    "March 9-10", "May 18-19",
    "March 23-24", "June 15-16",
    "June 29-30", "July 13-14",
    "July 27-28", "August 10-11",
    "September 7-8", "September 21-22",
    "October 5-6", "October 19-20",
    "November 9-10", "November 23-24",
  ];

  return (
    <main>
      {/* Breadcrumb */}
      <section className="mt-20 mb-2 p-4">
        <div className="flex items-start font-semibold">
          <Link to="/" className="flex items-center text-gray-500">
            Home <ChevronsRight className="text-black mx-2" size={20} />
          </Link>

          <HashLink to="/#trainings" className="flex items-center text-gray-500">
            Trainings <ChevronsRight className="text-black mx-2" size={20} />
          </HashLink>
          <p className="text-red-900">BERTST Training</p>
        </div>
      </section>

      {/* MAIN SECTION */}
      <section
        id="berts-training"
        className="relative flex flex-col lg:flex-row justify-center items-stretch text-red-900 px-4 mb-8 gap-4"
      >
        {/* LEFT CONTENT */}
        <div
          className="relative lg:w-3/4 w-full p-6 rounded-2xl shadow-md bg-no-repeat bg-cover bg-center flex flex-col overflow-hidden"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          {/* ✅ Soft red tint overlay + subtle gradient (keeps background visible) */}
          <div className="absolute inset-0 bg-red-900/15" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/15" />

          {/* ✅ Content Wrapper */}
          <div className="relative z-10">
            <h2 className="text-[#04204a] font-extrabold text-3xl sm:text-5xl leading-tight">
              Basic Emergency Response Team Simulation Training (BERTST)
            </h2>

      

            {/* ✅ Glass paragraph block (less boring than plain text on background) */}
            <div className="mt-4 rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-4 sm:p-5">
              <p className="text-black text-base sm:text-lg text-justify leading-relaxed">
                The University of the Philippines Manila Disaster Risk Reduction and Management for Health Program&apos;s
                Basic Emergency response team simulation training aims to improve the skills on command, communication and
                collaboration.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch mt-5 gap-6">
              {/* IMAGE COLUMN */}
              <div className="w-full lg:w-[420px] flex items-center">
                <img
                  src={BertsImg}
                  alt="BERTS"
                  className="w-full max-h-[520px] object-cover rounded-xl shadow-md"
                />
              </div>

              {/* TEXT COLUMN */}
              <div className="flex-1 space-y-5">
                <div className="rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-4 sm:p-5">
                  <h2 className="text-[#04204a] text-xl sm:text-3xl font-extrabold uppercase mb-2">
                    What is BERTST?
                  </h2>

                  <p className="text-black text-base sm:text-lg text-justify leading-relaxed">
                    The Basic Emergency Response Team Simulation Training (BERTST) is a program by the University of the
                    Philippines Manila Disaster Risk Reduction and Management for Health program. It is designed to enhance
                    participants&apos; skills in command, communication, and collaboration during emergency situations.
                  </p>
                </div>

                <div className="rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-4 sm:p-5">
                  <h2 className="text-[#04204a] text-xl sm:text-3xl font-extrabold uppercase mb-2">
                    What we do at BERTST training?
                  </h2>

                  <ul className="text-black text-base sm:text-lg leading-relaxed list-disc ml-6 space-y-1.5">
                    <li>Simulation Exercises: Hands-on emergency response drills.</li>
                    <li>Command Training: Developing leadership in crisis situations.</li>
                    <li>Communication Drills: Improving coordination among responders.</li>
                    <li>Collaboration Workshops: Enhancing teamwork in disaster response.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 bg-[#04204a] rounded-2xl shadow-md w-full lg:w-1/3 text-center flex flex-col">
          {/* TRAINING DATES */}
          <div>
            <p className="text-yellow-400 text-lg sm:text-xl font-bold mb-4">
              Training Dates for 2026
            </p>

            <ol className="grid grid-cols-2 gap-4 text-white text-sm sm:text-lg">
              {dates.map((date, i) => (
                <li
                  key={i}
                  className="border border-white px-4 py-2 rounded-full text-center cursor-default"
                >
                  {date}
                </li>
              ))}
            </ol>
          </div>

       {/* QR + FEE SECTION */}
<div className="mt-6 flex flex-col items-center gap-5">
  
  {/* QR */}
  <div className="flex flex-col items-center gap-2">
    <p className="text-white text-xs sm:text-sm text-center">
      Or Scan the QR Code Below:
    </p>

    <img
      src={BertsQR}
      alt="QR Code"
      className="w-24 sm:w-28 md:w-32 bg-white p-1 rounded-lg shadow-md"
    />
  </div>

  {/* Fee */}
  <div className="flex flex-col items-center gap-2">
    <p className="text-yellow-400 text-lg font-bold">
      Training Fee:
    </p>

    <p className="text-white text-lg sm:text-xl leading-snug">
      Php 5,500 / Participant
    </p>

    <a
      href="https://docs.google.com/forms/d/e/1FAIpQLSeCgCLNYH2CzVjGp3Dr420FooFyGpLpR-0UgZ_RoLJyJx3KWQ/viewform"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-yellow-500 text-white text-sm sm:text-base font-semibold px-5 py-2 rounded-lg transition-transform hover:scale-105 hover:bg-yellow-600 shadow-md"
    >
      JOIN NOW!
    </a>
  </div>
</div>

        </div>
      </section>
    </main>
  );
}

export default Trainings;
