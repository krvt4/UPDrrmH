import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import MCIQR from "../assets/BertsMciRegisQRcode.png";
import MCIImg from "../assets/MCI-img.png";
import backgroundImage from "../assets/mci-bg.png";
import { ChevronsRight } from "lucide-react";

function Training2() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const trainingDates = [
    "January 28-30",
    "February 11-13",
    "March 11-13",
    "March 25-27",
    "April 22-24",
    "May 6-8",
    "May 20-22",
    "June 17-19",
    "July 1-3",
    "July 15-17",
    "July 29-31",
    "August 12-14",
    "September 9-11",
    "September 23-25",
    "October 7-9",
    "October 21-23",
    "November 11-13",
    "November 25-27",
    "December 3-5",
  ];

  const glassBox =
    "rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-4 sm:p-5";
  const glassList =
    "rounded-xl bg-white/35 backdrop-blur-sm border border-white/30 shadow-sm p-3 sm:p-4";

  return (
    <main>
      {/* Breadcrumb */}
      <section className="mt-20 mb-2 p-4">
        <div className="flex items-start text-black font-semibold">
          <Link to="/" className="flex items-center text-gray-500">
            Home <ChevronsRight className="text-black mx-2" size={20} />
          </Link>
          <p className="text-red-900">MCI Training</p>
        </div>
      </section>

      {/* MAIN SECTION */}
      <section
        id="mci-training"
        className="relative flex flex-col lg:flex-row justify-center items-stretch text-blue-900 px-4 mb-8 gap-4"
      >
        {/* LEFT CONTENT */}
        <div
          className="relative lg:w-3/4 w-full p-6 rounded-2xl shadow-md bg-no-repeat bg-cover bg-center flex flex-col overflow-hidden"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-green-900/15" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/15" />

          <div className="relative z-10">
            <h2 className="text-[#06441f] text-3xl sm:text-5xl font-extrabold leading-tight mt-6">
              Mass Casualty Incident and Triage (MCI)
            </h2>

            <p
              className={`text-black text-base sm:text-lg text-justify leading-relaxed my-5 ${glassBox}`}
            >
              <span className="block">
                This training program aims to familiarize participants with the
                concepts and different triage system algorithms through simulation
                exercises.
              </span>

              <span className="block mt-3">
                The objective is to equip the participants with advanced knowledge,
                skills, and attitude in applying disaster triage systems correctly to
                assign victims to appropriate triage categories.
              </span>
            </p>

            <div className="flex flex-col lg:flex-row items-start mt-6 gap-10">
              {/* Image */}
              <img
                src={MCIImg}
                alt="MCI"
                className="w-full max-w-[380px] lg:max-w-[460px] rounded-xl shadow-md mt-8 lg:mt-12"
              />

              <div className="flex-1">
                <h2 className="text-[#06441f] text-xl sm:text-3xl font-extrabold uppercase mb-3">
                  What is MCI?
                </h2>

                <p
                  className={`text-black text-sm sm:text-base md:text-lg text-justify leading-relaxed mb-6 ${glassBox}`}
                >
                  <span className="block">
                    MCI stands for Mass Casualty Incident, which refers to any
                    emergency situation where the number of victims exceeds the
                    available medical resources.
                  </span>

                  <span className="block mt-3">
                    This requires an organized and efficient response to prioritize
                    care.
                  </span>
                </p>

                <h2 className="text-[#06441f] text-xl sm:text-3xl font-extrabold uppercase mb-3">
                  What we do at MCI training?
                </h2>

                <ul
                  className={`text-black text-sm sm:text-base md:text-lg leading-snug list-disc list-inside space-y-1 ${glassList}`}
                >
                  <li>Understanding MCI and Triage Concepts</li>
                  <li>Learning Triage Systems and Algorithms</li>
                  <li>Practical Hands-On Training</li>
                  <li>Case-Scenario Simulations</li>
                  <li>Team-Based Exercises</li>
                  <li>Decision-Making and Critical Thinking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 bg-[#06441f] rounded-2xl shadow-md w-full lg:w-1/3 text-center flex flex-col">
          <div>
            <p className="text-yellow-400 text-lg sm:text-xl font-bold mb-4">
              Training Dates for 2026
            </p>

            <ol className="grid grid-cols-2 gap-4 text-white text-sm sm:text-lg">
              {trainingDates.map((date, i) => (
                <li
                  key={i}
                  className={`border border-white px-4 py-2 rounded-full text-center hover:bg-white hover:text-[#06441f] transition duration-300 cursor-default
                  ${date === "December 3-5" ? "col-span-2 mx-auto w-[70%]" : ""}`}
                >
                  {date}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center text-center space-y-3">
              <p className="text-yellow-400 text-lg sm:text-xl font-bold">
                Training Fee:
              </p>

              <div className="text-white space-y-2 text-sm sm:text-base font-medium">
                <p className="text-lg sm:text-xl">
                  PHP 5,500 <span className="opacity-90">(Early)</span>
                </p>
                <p className="text-lg sm:text-xl">
                  PHP 6,000 <span className="opacity-90">(Regular)</span>
                </p>
                <p className="text-lg sm:text-xl">
                  PHP 6,500 <span className="opacity-90">(Late)</span>
                </p>
              </div>

              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfeSXyPo0XvruCV7-5Ei32lPkmoPSua15XX8VF19lLjAKImlw/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 bg-yellow-500 text-white font-semibold px-6 py-3 rounded-lg transition-transform hover:scale-105 hover:bg-yellow-600 shadow-md"
              >
                JOIN NOW!
              </a>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="leading-tight">
                <p className="text-white text-sm sm:text-base font-semibold">
                  Scan the QR Code
                </p>
              </div>

              <img
                src={MCIQR}
                alt="QR Code"
                className="w-32 sm:w-36 md:w-40 bg-white p-2 rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Training2;