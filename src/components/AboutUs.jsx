import React, { useMemo, useState, useEffect, useRef } from "react";
import historyImg from "../assets/1742136043289.jpg";
import Vision from "../assets/Vision.png";
import Target from "../assets/Target.png";
import Values from "../assets/Values.png";
import MisVisBg3 from "../assets/misvis-bg3.png";
import videoBg from "../assets/background.png";
import aboutBg from "../assets/careers-redbg.png";

const MAROON = "#7B1113";
const YELLOW = "#F4C430";

function AboutUs() {
  const [rotationCount, setRotationCount] = useState(0);
  const [misvisOpen, setMisvisOpen] = useState(false);
  const [misvisType, setMisvisType] = useState(null);
  const [pauseAutoScroll, setPauseAutoScroll] = useState(false);
  const modalBodyRef = useRef(null);

  const missionItems = useMemo(
    () => [
      {
        k: "UP",
        text: "lift the value and status level of the organization as the lead resource in disaster risk reduction and management in health.",
      },
      {
        k: "D",
        text: "evelop individual’s competence in disaster risk reduction and management in health to minimize disaster related injuries, disabilities, diseases, and deaths through capacity building programs, research, and public service.",
      },
      {
        k: "R",
        text: "evitalize institutional linkages with multiple stakeholders enabling enhanced collaboration among healthcare providers, community leaders, private institutions, and the academe.",
      },
      {
        k: "R",
        text: "einforce research agendas to gather evidence based data, create policies, programs, and publications to contribute knowledge and build capacity towards health resilient communities during disaster.",
      },
      {
        k: "M",
        text: "otivate internal stakeholders towards professional and personal upliftment while managing scarce resources to achieve sustainability.",
      },
      {
        k: "H",
        text: "arness technological advancement to create world-class processes and systems that would promote innovative programs and technical know-how promoting quality of life and sustainability of the communities we serve.",
      },
    ],
    []
  );

  const visionText =
    "The academe's center for world class capacity building, research and public services in DRRM-H related issues in the Philippines by 2030.";

  const coreValues = useMemo(
    () => [
      "Honor",
      "Excellence",
      "Accountability",
      "Leadership",
      "Transformation",
      "Harmony",
    ],
    []
  );

  const openMisVis = (type) => {
    setMisvisType(type);
    setMisvisOpen(true);
  };

  const closeMisVis = () => {
    setMisvisOpen(false);
    setMisvisType(null);
  };

  const modalConfig =
    misvisType === "mission"
      ? { title: "MISSION", logo: Target }
      : misvisType === "vision"
      ? { title: "VISION", logo: Vision }
      : { title: "CORE VALUES", logo: Values };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeMisVis();
    };

    if (misvisOpen) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [misvisOpen]);

  useEffect(() => {
    if (!misvisOpen) return;
    if (misvisType !== "mission") return;

    const el = modalBodyRef.current;
    if (!el) return;

    el.scrollTop = 0;
    if (el.scrollHeight <= el.clientHeight + 2) return;

    let rafId;
    let last = performance.now();
    const speed = 18;

    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;

      if (!pauseAutoScroll) {
        el.scrollTop += speed * dt;

        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          el.scrollTop = 0;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [misvisOpen, misvisType, pauseAutoScroll]);

  return (
    <>
      <main
        className="min-h-screen pt-8 md:pt-18 pb-14 overflow-x-hidden"
        style={{
          fontFamily: '"Montserrat", sans-serif',
          background: `
            radial-gradient(circle at top, rgba(123,17,19,0.05), rgba(123,17,19,0.08)),
            linear-gradient(180deg, #fdf8f8 0%, #f8f1f1 100%)
          `,
        }}
      >
        {/* HERO */}
        <section
          className="relative h-[220px] md:h-[300px] flex items-center justify-center text-center px-4 bg-cover bg-center"
          style={{ backgroundImage: `url(${aboutBg})` }}
        >
          <div className="absolute inset-0 bg-[#7B1113]/30" />

          <div className="relative z-10 max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-wide text-white">
              WHO WE ARE
            </h1>
            <p className="mt-4 text-xl md:text-[2rem] leading-relaxed text-white/95 font-semibold">
              A leading academic center advancing disaster preparedness through
              simulation-based training
            </p>
          </div>
        </section>

        <div className="max-w-[1450px] mx-auto px-6 md:px-10 py-10 md:py-14">
          {/* DESCRIPTION */}
          <section className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#7B1113]">
              Empowering Resilience in Health
            </h2>

            <div
              className="max-w-6xl mx-auto text-[1.3rem] md:text-[1.7rem] leading-[2.8rem] md:leading-[3rem] text-neutral-900 px-2 md:px-4 space-y-6 font-medium"
              style={{
                textAlign: "justify",
                textAlignLast: "center",
                textShadow: "0 1px 1px rgba(0,0,0,0.08)",
              }}
            >
              <p>
                UPM DRRM-H (Disaster Risk Reduction and Management in Health) is
                committed to advancing disaster preparedness through innovative
                training, research, and public service. By integrating
                simulation-based learning and evidence-driven approaches, it
                equips individuals, professionals, and communities with the
                knowledge and skills to effectively respond to health-related
                emergencies. As a hub for collaboration and capacity building, it
                strives to strengthen resilience and improve health outcomes in
                times of crisis.
              </p>

              <p>
                DRRM-H is dedicated to promoting safer communities through
                effective disaster preparedness and health-focused interventions.
              </p>
            </div>
          </section>

          {/* HISTORY */}
          <section className="mb-16">
            <div
              className="relative rounded-[28px] overflow-hidden shadow-[0_16px_40px_rgba(123,17,19,0.18)]"
              style={{
                backgroundImage: `url(${historyImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-white/55 backdrop-blur-[1px]" />

              <div className="relative z-10 p-7 md:p-10 lg:p-12">
                <div className="max-w-5xl">
                  <p className="text-base md:text-lg font-semibold uppercase tracking-[0.24em] mb-2 text-[#9a7a38]">
                    Our Story
                  </p>

                  <h2 className="text-[2.6rem] md:text-[3.6rem] font-extrabold text-[#7B1113]">
                    HISTORY
                  </h2>

                  <div className="h-[0px] w-0 mt-3 mb-6 bg-[#F4C430]" />

                  <div
                    className="text-[1.7rem] md:text-[2rem] leading-[3.5rem] md:leading-[5rem] text-neutral-900 text-justify max-w-4xl font-medium"
                    style={{
                      textShadow: "0 1px 1px rgba(0,0,0,0.08)",
                    }}
                  >
                    <p className="mb-5">
                      The University of the Philippines Manila Disaster Risk
                      Reduction and Management in Health (UPM DRRM-H) was
                      officially launched on 8 June 2022 to conduct
                      state-of-the-art disaster simulation trainings and
                      evidence-based research. Established to provide virtual
                      disaster training programs, it aims to prevent mistakes in
                      actual catastrophic situations by utilizing advanced
                      simulation technologies. Located on the 2nd floor of Joaquin
                      Gonzales Hall in UPM, it also serves as a hub for research.
                    </p>

                    <p>
                      Dr. Carlos Primero Gundran, UPM DRRM-H Head, highlighted its
                      significance: “The Philippines is one of the most
                      disaster-prone countries in the world. Through UPM DRRM-H,
                      we seek to conduct training and seminars that will prepare
                      our responders, even ordinary employees, in disaster
                      preparedness through our state-of-the-art facilities. We can
                      finally hold disaster preparedness training virtually, and
                      mistakes could be prevented in actual situations.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CLICKABLE VISION / MISSION / CORE VALUES */}
          <section
            className="py-16 px-4 flex justify-center items-center bg-cover bg-center bg-no-repeat rounded-[28px] overflow-hidden"
            style={{ backgroundImage: `url(${MisVisBg3})` }}
          >
            <div className="flex flex-col items-center space-y-6 w-full">
              <h2 className="text-xl md:text-3xl font-bold text-center uppercase text-red-900 tracking-wide mb-10">
                Vision, Mission & Core Values
              </h2>

              <div className="flex items-center justify-center gap-4 md:gap-8 relative w-full">
                <button
                  onClick={() => setRotationCount((prev) => prev - 1)}
                  className="bg-white/70 backdrop-blur-md text-[#7B1113] font-bold p-3 rounded-full hover:bg-white/85 shadow-md transform transition hover:scale-110 z-10 border border-white/40"
                  aria-label="Previous"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 md:h-10 md:w-10"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <div className="scene relative w-[320px] sm:w-[430px] md:w-[500px] h-[430px] md:h-[540px] perspective-[1000px] mx-2 md:mx-4 pt-6 md:pt-10">
                  <div
                    className="carousel absolute w-full h-full transition-transform duration-700"
                    style={{
                      transform: `translateZ(-340px) rotateY(${
                        rotationCount * -120
                      }deg)`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div
                      onClick={() => openMisVis("mission")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && openMisVis("mission")
                      }
                      className="carousel__cell cursor-pointer select-none bg-red-900/90 backdrop-blur-lg rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.5)] text-white p-6 w-[320px] sm:w-[420px] md:w-[490px] h-[300px] md:h-[390px] absolute flex flex-col justify-center items-center text-center space-y-5 transition-all duration-300 hover:scale-[1.02] hover:bg-red-900/95 active:scale-[0.99]"
                      style={{
                        transform: "rotateY(0deg) translateZ(400px)",
                        left: "50%",
                        marginLeft: "-245px",
                      }}
                    >
                      <div className="p-3 rounded-full bg-white/90 ring-1 ring-white/100">
                        <img
                          src={Target}
                          alt="Mission Icon"
                          className="h-10 w-10 md:h-12 md:w-12 object-contain"
                        />
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide">
                        Mission
                      </h2>
                      <div className="text-sm md:text-base opacity-95 px-4 md:px-6 leading-relaxed">
                        Pioneering disaster virtual reality in the Philippines
                      </div>
                      <div className="w-16 h-[2px] bg-white/40 rounded-full" />
                    </div>

                    <div
                      onClick={() => openMisVis("vision")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && openMisVis("vision")
                      }
                      className="carousel__cell cursor-pointer select-none bg-red-900/90 backdrop-blur-lg rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.5)] text-white p-6 px-8 md:px-10 w-[320px] sm:w-[420px] md:w-[490px] h-[300px] md:h-[390px] absolute flex flex-col justify-center items-center text-center space-y-5 transition-all duration-300 hover:scale-[1.02] hover:bg-red-900/95 active:scale-[0.99]"
                      style={{
                        transform: "rotateY(120deg) translateZ(400px)",
                        left: "50%",
                        marginLeft: "-245px",
                      }}
                    >
                      <div className="p-3 rounded-full bg-white/90 ring-1 ring-white/100">
                        <img
                          src={Vision}
                          alt="Vision Icon"
                          className="h-10 w-10 md:h-12 md:w-12 object-contain"
                        />
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide">
                        Vision
                      </h2>
                      <p className="text-sm md:text-base opacity-95 leading-relaxed">
                        {visionText}
                      </p>
                      <div className="w-16 h-[2px] bg-white/40 rounded-full" />
                    </div>

                    <div
                      onClick={() => openMisVis("values")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && openMisVis("values")
                      }
                      className="carousel__cell cursor-pointer select-none bg-red-900/90 backdrop-blur-lg rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.5)] text-white p-6 w-[320px] sm:w-[420px] md:w-[490px] h-[300px] md:h-[390px] absolute flex flex-col justify-center items-center text-center space-y-5 transition-all duration-300 hover:scale-[1.02] hover:bg-red-900/95 hover:shadow-[0_0_35px_rgba(0,0,0,0.65)]"
                      style={{
                        transform: "rotateY(240deg) translateZ(400px)",
                        left: "50%",
                        marginLeft: "-245px",
                      }}
                    >
                      <div className="p-4 rounded-full bg-white/90 ring-1 ring-white/100 shadow-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 64 64"
                          className="h-12 w-12 md:h-14 md:w-14"
                          fill="none"
                        >
                          {/* Sparkle Left */}
                          <path
                            d="M14 22L15 25L18 26L15 27L14 30L13 27L10 26L13 25L14 22Z"
                            fill="#000"
                          />

                          {/* Sparkle Right */}
                          <path
                            d="M50 24L51 27L54 28L51 29L50 32L49 29L46 28L49 27L50 24Z"
                            fill="#000"
                          />

                          {/* Flame (clean torch-style, not candle-like) */}
                          <path
                            d="M32 8C38 14 42 20 42 28C42 35 37.5 40 32 40C26.5 40 22 35 22 28C22 20 26 14 32 8Z"
                            fill="#000"
                          />

                          {/* Inner flame cut (gives depth like your image) */}
                          <path
                            d="M32 16C36 20 38 24 38 28C38 32 35.5 35 32 35C28.5 35 26 32 26 28C26 24 28 20 32 16Z"
                            fill="#fff"
                          />

                          {/* Torch bowl (key difference vs candle look) */}
                          <path
                            d="M22 40H42C41 45 37 48 32 48C27 48 23 45 22 40Z"
                            fill="#000"
                          />

                          {/* Stem */}
                          <rect x="28" y="48" width="8" height="10" fill="#000" />

                          {/* Base */}
                          <rect x="26" y="58" width="12" height="3" rx="1.5" fill="#000" />
                        </svg>
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide">
                        Core Values
                      </h2>
                      <div className="flex flex-wrap justify-center gap-2 px-2 md:px-6">
                        {coreValues.map((v) => (
                          <span
                            key={v}
                            className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/15"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                      <div className="w-16 h-[2px] bg-white/40 rounded-full" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setRotationCount((prev) => prev + 1)}
                  className="bg-white/70 backdrop-blur-md text-[#7B1113] font-bold p-3 rounded-full hover:bg-white/85 shadow-md transform transition hover:scale-110 z-10 border border-white/40"
                  aria-label="Next"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 md:h-10 md:w-10"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          {/* ABOUT US VIDEO */}
          <section className="mt-10 mb-16">
            {/* TITLE OUTSIDE CARD */}
            <div className="text-center mb-8">
              <h2 className="text-[2.6rem] md:text-[3.6rem] font-extrabold text-[#7B1113] tracking-wide"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}>
                WATCH OUR STORY
              </h2>
            </div>

            {/* VIDEO CARD */}
            <div
              className="relative rounded-[28px] overflow-hidden shadow-[0_16px_40px_rgba(123,17,19,0.25)] p-6 md:p-8 lg:p-10"
              style={{
                backgroundImage: `url(${videoBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* OPTIONAL OVERLAY (recommended for readability) */}
              <div className="absolute inset-0 bg-[#7B1113]/60 backdrop-blur-[1px]" />

              <div className="relative z-10 rounded-[20px] overflow-hidden bg-black">
                <video
                  controls
                  className="w-full h-auto block"
                  preload="metadata"
                >
                  <source src="/uploads/videos/UpdatedAboutUs.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </section>
        </div>
      </main>

      {misvisOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          onClick={closeMisVis}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />

          <div
            className="relative w-full max-w-[820px] rounded-2xl shadow-2xl bg-white animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeMisVis}
              className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md transition"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="px-8 md:px-14 pt-5 pb-0 text-center">
              <div className="mx-auto w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center shadow-sm bg-white">
                <img
                  src={modalConfig.logo}
                  alt={`${modalConfig.title} logo`}
                  className="w-10 h-10 object-contain"
                />
              </div>

              <h3 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-wide text-[#7B1113] uppercase">
                {modalConfig.title}
              </h3>

              <div className="mt-6 h-px w-full bg-gray-200" />
            </div>

            <div
              ref={modalBodyRef}
              onMouseEnter={() => setPauseAutoScroll(true)}
              onMouseLeave={() => setPauseAutoScroll(false)}
              className="px-8 md:px-14 pb-8 overflow-y-auto max-h-[calc(100vh-18rem)]"
            >
              {misvisType === "mission" && (
                <div className="space-y-7 text-left text-gray-800 leading-relaxed">
                  {missionItems.map((row, idx) => (
                    <p key={`${row.k}-${idx}`} className="text-base md:text-lg">
                      <span className="font-extrabold text-xl md:text-2xl text-gray-900 mr-1">
                        {row.k}
                      </span>
                      {row.text}
                    </p>
                  ))}
                </div>
              )}

              {misvisType === "vision" && (
                <div className="mx-auto max-w-3xl text-left text-gray-800">
                  <p className="text-base md:text-lg leading-relaxed">
                    {visionText}
                  </p>

                  <div className="mt-8 flex items-center justify-center">
                    <div className="w-24 h-[3px] bg-red-900/70 rounded-full" />
                  </div>
                </div>
              )}

              {misvisType === "values" && (
                <div className="mx-auto max-w-3xl text-center">
                  <div className="flex flex-wrap justify-center gap-3">
                    {coreValues.map((value) => (
                      <span
                        key={value}
                        className="px-4 py-2 rounded-full bg-red-900/10 text-[#7B1113] font-semibold border border-red-900/15"
                      >
                        {value}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-center">
                    <div className="w-24 h-[3px] bg-red-900/70 rounded-full" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes popIn {
              0% { opacity: 0; transform: translateY(14px) scale(.975) }
              100% { opacity: 1; transform: translateY(0) scale(1) }
            }
            .animate-fadeIn { animation: fadeIn .18s ease-out forwards; }
            .animate-popIn { animation: popIn .22s ease-out forwards; }
          `}</style>
        </div>
      )}
    </>
  );
}

export default AboutUs;