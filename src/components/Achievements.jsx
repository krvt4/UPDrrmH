import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  ShieldCheck,
  Star,
  BadgeCheck,
  FileBadge,
  FileCheck,
  ScrollText,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import achievementsBg from "../assets/careers-redbg.png";
import achievementsSectionBg from "../assets/background.png";

function Achievements() {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [activeAwardsIndex, setActiveAwardsIndex] = useState(0);
  const [activeCertificationsIndex, setActiveCertificationsIndex] = useState(0);

  const awardsScrollRef = useRef(null);
  const certificationsScrollRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedAchievement(null);
    };

    if (selectedAchievement) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedAchievement]);

  const awards = useMemo(
    () => [
      {
        id: 1,
        icon: Trophy,
        title: "Learning and Development Summit Recognition",
        image: "/uploads/pictures/DSC1.jpg",
        summary:
          "Recognition for technical expertise and valuable contribution to the successful conduct of the 2023 Learning and Development Summit.",
        description:
          "This plaque recognizes the efforts, technical expertise, and invaluable contribution of Dr. Carlos Primero D. Gundran to the successful conduct of the 2023 Learning and Development Summit.",
      },
      {
        id: 2,
        icon: Medal,
        title: "Cordillera Resiliency Framework and Plan Development",
        image: "/uploads/pictures/DSC2.jpg",
        summary:
          "Awarded for distinguished and invaluable service as Resource Speaker during the Webinar-Workshop on Cordillera Resiliency Framework and Plan Development.",
        description:
          "This plaque of appreciation honors the distinguished and invaluable service rendered by Dr. Carlos Primero D. Gundran as Resource Speaker during the Webinar-Workshop on Cordillera Resiliency Framework and Plan Development.",
      },
      {
        id: 3,
        icon: Award,
        title: "EMTECH Asia 2011",
        image: "/uploads/pictures/DSC3.jpg",
        summary:
          "Given for sharing insights, expertise, and experiences on Emergency Medical Services during EMTECH Asia 2011.",
        description:
          "This recognition was awarded to Dr. Carlos Primero D. Gundran for sharing insights, expertise, and experiences on Emergency Medical Services during EMTECH Asia 2011.",
      },
      {
        id: 4,
        icon: ShieldCheck,
        title: "APO Preparedness Webinar",
        image: "/uploads/pictures/DSC4.jpg",
        summary:
          "Presented in appreciation for serving as Resource Speaker in the webinar “What Is The Big One? And Why We Need To Prepare For It.”",
        description:
          "This plaque was presented to Dr. Carlos Primero D. Gundran in appreciation for the valuable time and expertise he shared as Resource Speaker in the preparedness webinar titled “What Is The Big One? And Why We Need To Prepare For It.”",
      },
      {
        id: 5,
        icon: Star,
        title: "First Academic Society Conference on Climate and Disaster Resilience",
        image: "/uploads/pictures/DSC5.jpg",
        summary:
          "Awarded for invaluable contribution as Moderator during the First Academic Society Conference on Climate and Disaster Resilience.",
        description:
          "This plaque of appreciation recognizes the invaluable contribution of Dr. Carlos Primero D. Gundran as Moderator during the First Academic Society Conference on Climate and Disaster Resilience.",
      },
      {
        id: 6,
        icon: BadgeCheck,
        title: "Gawad Sinag",
        image: "/uploads/pictures/DSC6.jpg",
        summary:
          "Conferred in recognition of meaningful contribution and leadership as Chief Resident in the Department of Emergency Medicine.",
        description:
          "This award honors the meaningful contribution and leadership of Dr. Carlos Primero D. Gundran as Chief Resident in the Department of Emergency Medicine.",
      },
    ],
    []
  );

  const certifications = useMemo(
    () => [
      {
        id: 1,
        icon: FileBadge,
        title: "Visayas Leg 2025 Certificate of Appreciation",
        image: "/uploads/pictures/DSC_9328.JPG",
        summary:
          "Presented to the University of the Philippines Manila for invaluable support and active participation as exhibitor during the Handa Pilipinas sa Bagong Pilipinas exposition.",
        description:
          "This certificate of appreciation was presented to the University of the Philippines Manila in grateful recognition of invaluable support and active participation as exhibitor during the Handa Pilipinas sa Bagong Pilipinas: Innovations in Climate and Disaster Resilience Nationwide Exposition 2025 (Visayas Leg).",
      },
      {
        id: 2,
        icon: FileCheck,
        title: "Luzon Leg 2025 Certificate of Appreciation",
        image: "/uploads/pictures/DSC_9331.JPG",
        summary:
          "Awarded to UP–Manila in grateful recognition of invaluable contribution as exhibitor during the 2025 Handa Pilipinas sa Bagong Pilipinas: Luzon Leg.",
        description:
          "This certificate of appreciation was awarded to UP–Manila in recognition of invaluable contribution as exhibitor during the 2025 Handa Pilipinas sa Bagong Pilipinas: Innovations in Climate and Disaster Resilience Nationwide Exposition (Luzon Leg).",
      },
      {
        id: 3,
        icon: ScrollText,
        title: "Visayas Leg Partnership Certificate",
        image: "/uploads/pictures/DSC_9332.JPG",
        summary:
          "Certificate of appreciation awarded to the University of the Philippines Manila for invaluable support and partnership during Handa Pilipinas: Visayas Leg.",
        description:
          "This certificate recognizes the valuable support and partnership of the University of the Philippines Manila in the successful realization of Handa Pilipinas: Visayas Leg, further promoting disaster preparedness and resilience.",
      },
      {
        id: 4,
        icon: ShieldCheck,
        title: "Pagkilala from Ugnayan ng Pahinungod Manila",
        image: "/uploads/pictures/DSC_9334.JPG",
        summary:
          "Certificate of recognition awarded to Dr. Carlos Primero Gundran for notable contribution and dedication to the programs of Ugnayan ng Pahinungod Manila.",
        description:
          "This framed certificate of recognition honors Dr. Carlos Primero Gundran for his notable contribution and dedication to the programs of Ugnayan ng Pahinungod Manila and for his service to public-oriented initiatives.",
      },
      {
        id: 5,
        icon: Star,
        title: "DRRM-H Team Recognition Photo",
        image: "/uploads/pictures/DSC_9336.JPG",
        summary:
          "A framed group recognition image featuring the University of the Philippines Manila Disaster Risk Reduction and Management in Health Center team.",
        description:
          "This framed group image represents the Disaster Risk Reduction and Management in Health Center team of the University of the Philippines Manila and serves as a visual recognition of the organization and its members.",
      },
      {
        id: 6,
        icon: Award,
        title: "Emergency Medicine Workshop Certificate of Appreciation",
        image: "/uploads/pictures/DSC_9338.JPG",
        summary:
          "Presented to the UP-Manila Disaster Risk Reduction and Management in Health Center for facilitating the pre-convention workshop on Mass Casualty Incident and Disaster Preparedness.",
        description:
          "This certificate of appreciation was presented to the UP-Manila Disaster Risk Reduction and Management in Health Center for facilitating the pre-convention workshop on Mass Casualty Incident and Disaster Preparedness during the 25th Postgraduate Course entitled EvolvED: The Future of Emergency Medicine Practice.",
      },
      {
        id: 7,
        icon: BadgeCheck,
        title: "DRRM-H Summit 2025 Certificate of Appreciation",
        image: "/uploads/pictures/DSC_9340.JPG",
        summary:
          "Presented to the University of the Philippines for outstanding and invaluable contributions during disaster response operations.",
        description:
          "This certificate of appreciation recognizes the University of the Philippines for outstanding and invaluable contributions during disaster response operations, highlighting dedication, partnership, and resilience in times of crisis.",
      },
      {
        id: 8,
        icon: Medal,
        title: "Certificate of Participation – Exhibitor",
        image: "/uploads/pictures/DSC_9343.JPG",
        summary:
          "Presented to the Philippine Council for Health Research and Development as exhibitor during the Handa Pilipinas exposition.",
        description:
          "This framed certificate of participation was presented to the Philippine Council for Health Research and Development as exhibitor for featured technologies during the Handa Pilipinas exposition.",
      },
    ],
    []
  );

  const scrollByCard = (ref, direction, selector) => {
    if (!ref.current) return;

    const container = ref.current;
    const card = container.querySelector(selector);
    if (!card) return;

    const amount = card.clientWidth + 24;

    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const scrollToCard = (ref, index, selector) => {
    if (!ref.current) return;

    const container = ref.current;
    const cards = container.querySelectorAll(selector);
    const target = cards[index];

    if (!target) return;

    container.scrollTo({
      left: target.offsetLeft - 16,
      behavior: "smooth",
    });
  };

  const handleScroll = (ref, selector, setActiveIndex) => {
    if (!ref.current) return;

    const container = ref.current;
    const cards = Array.from(container.querySelectorAll(selector));
    if (!cards.length) return;

    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  const renderGallery = ({
    items,
    scrollRef,
    activeIndex,
    setActiveIndex,
    cardSelector,
    sectionLabel,
    sectionTitle,
    sectionDescription,
    prevLabel,
    nextLabel,
  }) => (
    <section className="mb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-[2rem] md:text-[3.2rem] font-extrabold text-[#7B1113] tracking-wide">
            {sectionTitle}
          </h2>

          <p className="mt-3 text-sm md:text-base text-gray-700">
            {sectionDescription}
          </p>
        </div>

        <div
          className="relative rounded-[30px] overflow-hidden shadow-[0_16px_40px_rgba(123,17,19,0.22)] px-4 md:px-6 py-8 md:py-10"
          style={{
            backgroundImage: `url(${achievementsSectionBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[#7B1113]/72 backdrop-blur-[1px]" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-6">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                {sectionLabel}
              </p>

              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollByCard(scrollRef, "left", cardSelector)}
                  className="h-12 w-12 rounded-full bg-white/15 border border-white/15 text-white backdrop-blur-md flex items-center justify-center hover:bg-white/25 transition"
                  aria-label={prevLabel}
                >
                  <ArrowLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => scrollByCard(scrollRef, "right", cardSelector)}
                  className="h-12 w-12 rounded-full bg-[#F4C430] text-[#7B1113] border border-transparent flex items-center justify-center hover:scale-105 transition"
                  aria-label={nextLabel}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              onScroll={() => handleScroll(scrollRef, cardSelector, setActiveIndex)}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 no-scrollbar"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {items.map((item, index) => {
                const Icon = item.icon;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${sectionLabel}-${item.id}`}
                    type="button"
                    data-card
                    onClick={() => setSelectedAchievement(item)}
                    className={`group relative shrink-0 w-[86%] sm:w-[70%] md:w-[48%] xl:w-[37%] snap-start text-left rounded-[28px] overflow-hidden border transition duration-300 ${
                      isActive
                        ? "border-[#F4C430] shadow-[0_20px_40px_rgba(0,0,0,0.30)]"
                        : "border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
                    } bg-white/10 backdrop-blur-md hover:-translate-y-1`}
                  >
                    <div className="relative h-72 md:h-80 overflow-hidden">
                      <div
                        className="absolute inset-0 scale-110"
                        style={{
                          backgroundImage: `url(${item.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: "blur(14px) brightness(1.08)",
                          transform: "scale(1.12)",
                        }}
                      />

                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-y-0 left-0 w-[22%] bg-gradient-to-r from-black/30 to-transparent z-[1]" />
                      <div className="absolute inset-y-0 right-0 w-[22%] bg-gradient-to-l from-black/30 to-transparent z-[1]" />

                      <div className="absolute inset-0 z-[2] flex items-center justify-center px-6 md:px-8">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          style={{
                            filter:
                              "brightness(1.13) contrast(1.05) saturate(1.04)",
                            maskImage:
                              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.75) 18%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.75) 82%, transparent 100%)",
                            WebkitMaskImage:
                              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.75) 18%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.75) 82%, transparent 100%)",
                          }}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/1200x800/f3f4f6/7B1113?text=Achievement+Image";
                          }}
                        />
                      </div>

                      <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                      <div className="absolute top-4 left-4 z-[4]">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-md border border-white/15 shadow">
                          <Icon size={22} className="text-[#F4C430]" />
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-[4]">
                        <h3 className="text-lg md:text-xl font-extrabold leading-snug max-w-[95%] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 md:p-6 text-white min-h-[180px] flex flex-col">
                      <p
                        className="text-sm text-white/85 leading-relaxed flex-grow overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {item.summary}
                      </p>

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-[#F4C430] transition">
                        View Image
                        <ArrowRight size={15} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {items.map((item, index) => (
                  <button
                    key={`${sectionLabel}-dot-${item.id}`}
                    type="button"
                    onClick={() => scrollToCard(scrollRef, index, cardSelector)}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      activeIndex === index
                        ? "w-10 bg-[#F4C430]"
                        : "w-3 bg-white/35 hover:bg-white/60"
                    }`}
                    aria-label={`Go to ${item.title}`}
                  />
                ))}
              </div>

              <div className="md:hidden flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollByCard(scrollRef, "left", cardSelector)}
                  className="h-11 px-4 rounded-full bg-white/15 border border-white/15 text-white backdrop-blur-md flex items-center justify-center hover:bg-white/25 transition"
                >
                  <ArrowLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => scrollByCard(scrollRef, "right", cardSelector)}
                  className="h-11 px-4 rounded-full bg-[#F4C430] text-[#7B1113] flex items-center justify-center hover:scale-105 transition"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{
        fontFamily: '"Montserrat", sans-serif',
        background: `
          radial-gradient(circle at top, rgba(123,17,19,0.05), rgba(123,17,19,0.08)),
          linear-gradient(180deg, #fdf8f8 0%, #f8f1f1 100%)
        `,
      }}
    >
      <section
        className="relative w-full min-h-[58vh] bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-16"
        style={{ backgroundImage: `url(${achievementsBg})` }}
      >
        <div className="absolute inset-0 bg-[#7B1113]/55" />

        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="bg-white/15 backdrop-blur-xl rounded-[28px] shadow-2xl px-6 md:px-10 py-8 md:py-10 text-center text-white border border-white/10">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-wide">
              ACHIEVEMENTS
            </h1>

            <p className="mt-4 text-sm md:text-lg leading-relaxed max-w-3xl mx-auto text-white/95">
              A showcase of awards, certifications, and institutional
              recognitions connected to Dr. Carlos Primero D. Gundran and the
              University of the Philippines Manila.
            </p>
          </div>
        </div>
      </section>

      <section className="pt-14 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            Explore selected recognitions, certificates, and milestones that
            highlight contributions to disaster risk reduction, emergency
            medicine, health resilience, and public service.
          </p>
        </div>
      </section>

      {renderGallery({
        items: awards,
        scrollRef: awardsScrollRef,
        activeIndex: activeAwardsIndex,
        setActiveIndex: setActiveAwardsIndex,
        cardSelector: "[data-card]",
        sectionLabel: "Awards Series",
        sectionTitle: "Recognitions",
        sectionDescription: "Received by Dr. Carlos Primero D. Gundran.",
        prevLabel: "Previous awards",
        nextLabel: "Next awards",
      })}

      {renderGallery({
        items: certifications,
        scrollRef: certificationsScrollRef,
        activeIndex: activeCertificationsIndex,
        setActiveIndex: setActiveCertificationsIndex,
        cardSelector: "[data-card]",
        sectionLabel: "Certifications Series",
        sectionTitle: "Certifications",
        sectionDescription: "Certificates and related institutional recognitions.",
        prevLabel: "Previous certifications",
        nextLabel: "Next certifications",
      })}

      {selectedAchievement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedAchievement(null)}
          />

          <div className="relative z-10 w-full max-w-6xl rounded-[28px] overflow-hidden shadow-2xl bg-transparent">
            <button
              type="button"
              onClick={() => setSelectedAchievement(null)}
              className="absolute top-4 right-4 z-20 h-11 w-11 rounded-full bg-white/90 text-[#7B1113] font-bold shadow flex items-center justify-center hover:bg-white"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="relative w-full max-h-[88vh] overflow-hidden rounded-[28px]">
              <img
                src={selectedAchievement.image}
                alt={selectedAchievement.title}
                className="w-full h-auto max-h-[88vh] object-contain bg-transparent"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/1400x900/f3f4f6/7B1113?text=Achievement+Image";
                }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}

export default Achievements;