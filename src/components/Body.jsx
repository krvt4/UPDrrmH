import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import Slide1 from "../assets/Slide-MCI.png";
import Slide2 from "../assets/DSC_9999.jpg";
import Slide3 from "../assets/DSC_9998.jpg";

import BERSTImage from "../assets/BERSTImage.jpg";
import SFATBLSImage from "../assets/SFATBLSImage.png";
import MCIImage from "../assets/mci.jpg";

import backgroundImage from "../assets/background.png";

import {
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const slides = [Slide1, Slide2, Slide3];

function Body() {
  const [user] = useAuthState(auth);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [faqs, setFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [newsData, setNewsData] = useState([]);
  const [reviews, setReviews] = useState([]);

  const faqCardRef = useRef(null);
  const [faqParallax, setFaqParallax] = useState(0);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    category: "General Inquiry",
    message: "",
  });

  const [contactStatus, setContactStatus] = useState({
    loading: false,
    ok: false,
    message: "",
  });

  const fetchFaqs = async () => {
    try {
      const snapshot = await getDocs(collection(db, "faqs"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setFaqs(
        data.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        )
      );
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const showLoginMessage = () => {
    setLoginMessage("Please Login or Register first before accessing the website");
    setTimeout(() => setLoginMessage(""), 2000);
  };

  // ONLY training offer buttons stay protected
  const blockTrainingAccess = (e) => {
    if (!user) {
      e?.preventDefault?.();
      showLoginMessage();
      return true;
    }
    return false;
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    setContactStatus({ loading: true, ok: false, message: "" });

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Submission failed.");
      }

      setContactStatus({
        loading: false,
        ok: true,
        message: "Submitted successfully!",
      });

      setContactForm({
        name: "",
        email: "",
        company: "",
        category: "General Inquiry",
        message: "",
      });
    } catch (err) {
      setContactStatus({
        loading: false,
        ok: false,
        message: err?.message || "Something went wrong.",
      });
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const el = faqCardRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;

      const progress = (viewportH - rect.top) / (viewportH + rect.height);
      const clamped = Math.min(1, Math.max(0, progress));
      const y = (clamped - 0.5) * 18;

      setFaqParallax(y);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchNews = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "news"));
        const fetchedNews = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNewsData(fetchedNews);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    const fetchReviews = async () => {
      try {
        const snapshot = await getDocs(collection(db, "reviews"));
        const fetchedReviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReviews(
          fetchedReviews.sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          )
        );
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchNews();
    fetchReviews();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <>
      <div id="home" className="bg-gray-150">
        <section
          className="relative h-screen flex flex-col justify-center items-center text-center text-white bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 !bg-black/50"></div>

          <div className="relative z-10 px-4 md:px-25 text-center space-y-4 py-8 md:py-16">
            <p>Welcome to</p>
            <h1 className="font-extrabold uppercase">
              Disaster Risk Reduction and Management <br /> in Health Program
            </h1>
            <p className="hidden sm:block">
              The UPM DRRM-H Program aims to provide virtual disaster training
              programs to prevent mistakes in actual catastrophic situations using
              state-of-the-art disaster simulation training technologies.
            </p>
            <p>TRAININGS | RESEARCH | CONSULTANCY</p>
          </div>
        </section>

        <section className="w-full bg-red-50/70">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-6 text-left">
              <h2 className="text-3xl font-bold uppercase text-red-900">
                Recent Updates
              </h2>
            </div>

            <div className="relative rounded-[28px] border border-red-200/70 shadow-[0_18px_50px_rgba(0,0,0,0.10)] overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-b from-red-50 via-white to-red-50" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[85%] rounded-full bg-red-200/35 blur-3xl" />

              <div
                id="carousel"
                className="relative flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className="w-full flex-shrink-0 h-[320px] sm:h-[420px] lg:h-[540px]"
                  >
                    <img
                      src={slide}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover object-center"
                      draggable="false"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-2 mb-12">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`h-3 w-3 rounded-full transition ${
                    currentIndex === index
                      ? "bg-red-700 scale-110"
                      : "bg-red-200 hover:bg-red-300"
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold uppercase text-red-900">
                What's New?
              </h2>

              <Link
                to="/news"
                className="text-red-900 font-semibold hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="relative rounded-[28px] border border-red-200/70 shadow-[0_18px_50px_rgba(0,0,0,0.10)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-50 via-white to-red-50" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[85%] rounded-full bg-red-200/35 blur-3xl" />

              <div className="relative px-6 sm:px-10 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {newsData
                    .sort(
                      (a, b) =>
                        (b.createdAt?.toDate?.()?.getTime?.() || 0) -
                        (a.createdAt?.toDate?.()?.getTime?.() || 0)
                    )
                    .slice(0, 3)
                    .map((news) => (
                      <Link
                        key={news.id}
                        to={`/news/${news.id}`}
                        state={{ news }}
                        className="rounded-3xl overflow-hidden border border-red-200/70 bg-white/85 backdrop-blur-[2px] shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.12)] transition-all duration-300"
                      >
                        <div className="h-[220px] overflow-hidden">
                          <img
                            src={news.image}
                            alt={news.title}
                            className="w-full h-full object-cover hover:scale-105 transition duration-500"
                          />
                        </div>

                        <div className="p-6">
                          <p className="font-bold text-lg leading-snug text-gray-900 hover:text-red-900 transition line-clamp-3">
                            {news.title}
                          </p>

                          <p className="text-gray-600 text-sm mt-4">
                            {news.createdAt?.toDate
                              ? news.createdAt.toDate().toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>

                <div className="mt-10 flex justify-center">
                  <Link
                    to="/news"
                    className="bg-red-900 text-white py-3 px-8 rounded-md text-lg font-semibold hover:bg-red-700 transition duration-300 text-center"
                  >
                    Read All News
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="trainings" className="w-full bg-red-50/70">
          <div className="container mx-auto px-4 py-12">
            <div className="relative overflow-hidden rounded-[28px] border border-red-200/70 shadow-[0_18px_50px_rgba(0,0,0,0.10)] px-6 sm:px-10 py-12">
              <div className="absolute inset-0 bg-gradient-to-b from-red-50 via-white to-red-50" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[85%] rounded-full bg-red-200/35 blur-3xl" />

              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold uppercase text-red-900">
                      What We Offer
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      image: BERSTImage,
                      title:
                        "Basic Emergency Response Team Simulation Training (BERTST)",
                      link: "/training1",
                      buttonColor: "bg-[#04204a] hover:bg-[#02162f]",
                    },
                    {
                      image: MCIImage,
                      title: "Mass Casualty Incident (MCI) and Triage Training",
                      link: "/training2",
                      buttonColor: "bg-[#06441f] hover:bg-[#042e16]",
                    },
                    {
                      image: SFATBLSImage,
                      title:
                        "Standard First Aid and Basic Life Support (SFATBLS)",
                      link: "/training3",
                      buttonColor: "bg-[#7a0000] hover:bg-[#3b0000]",
                    },
                  ].map((training, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl overflow-hidden border border-red-200/70 bg-white/85 shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="h-[220px] overflow-hidden">
                        <img
                          src={training.image}
                          alt={training.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="min-h-[84px]">
                          <p className="text-gray-900 font-bold leading-tight text-[20px] md:text-[22px]">
                            {training.title}
                          </p>
                        </div>

                        <p className="text-gray-500 text-base mt-3">
                          Training Program
                        </p>

                        <div className="mt-auto pt-3">
                          <Link
                            to={training.link}
                            onClick={blockTrainingAccess}
                            className={`${training.buttonColor} w-full inline-flex items-center justify-center text-white font-semibold px-4 py-3 rounded-lg text-center transition`}
                          >
                            Read and Join Us!
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="support"
          className="scroll-mt-16 relative bg-cover bg-center bg-fixed py-20 px-4 text-white"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          <div className="container mx-auto relative max-w-5xl lg:max-w-6xl space-y-10">
            <div
              ref={faqCardRef}
              className="
                relative flex flex-col px-6 md:px-10 py-12
                rounded-2xl
                border border-white/20
                bg-black/50
                backdrop-blur-lg
                shadow-[0_0_25px_rgba(0,0,0,0.5)]
                overflow-hidden
                will-change-transform
              "
              style={{
                transform: `translateY(${faqParallax}px)`,
                transition: "transform 120ms ease-out",
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10 rounded-2xl" />

              <div className="relative">
                <div className="mb-6">
                  <h2 className="text-xl md:text-3xl uppercase font-semibold inline border-b-2 border-white">
                    FREQUENTLY ASKED QUESTIONS
                  </h2>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                  {faqs.length > 0 ? (
                    faqs.map((faq) => {
                      const isOpen = expandedId === faq.id;

                      return (
                        <div
                          key={faq.id}
                          className="faq-box bg-white/15 p-4 sm:p-6 rounded-lg relative shadow-lg backdrop-blur-xl w-full border border-white/10"
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpand(faq.id)}
                            className="w-full flex justify-between items-center text-left"
                            aria-expanded={isOpen}
                          >
                            <h3 className="text-lg md:text-xl font-bold pr-6">
                              {faq.question}
                            </h3>

                            <span className="shrink-0">
                              {isOpen ? <ChevronUp /> : <ChevronDown />}
                            </span>
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isOpen
                                ? "max-h-[600px] opacity-100 mt-4"
                                : "max-h-0 opacity-0 mt-0"
                            }`}
                          >
                            <p className="text-sm italic break-words leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-white italic">No FAQs yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-white/20 rounded-full" />

            <div className="relative flex flex-col md:flex-row px-6 md:px-10 pt-12 bg-black/50 backdrop-blur-lg rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.5)] items-stretch gap-8">
              <div className="review-section flex-1 z-10 w-full flex flex-col h-[510px]">
                <div className="mb-6">
                  <h2 className="text-xl md:text-3xl uppercase font-semibold inline border-b-2 border-white">
                    REVIEW
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scroll">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="review-box bg-white/20 p-4 sm:p-6 rounded-lg relative mb-6 shadow-lg backdrop-blur-lg w-full break-words"
                      >
                        <div className="review-content relative z-10">
                          <h3 className="text-lg md:text-xl font-bold">
                            {review.name}{" "}
                            <span className="text-yellow-500">
                              {"★".repeat(review.rating)}
                              {"☆".repeat(5 - review.rating)}
                            </span>
                          </h3>
                          <p className="role text-sm opacity-80">
                            {review.profession}
                          </p>
                          <p className="review-text text-sm mt-4 italic break-words leading-relaxed text-left whitespace-pre-line">
                            {review.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white italic">No reviews yet.</p>
                  )}
                </div>
              </div>

              <div
                id="contact"
                className="contact-section flex-1 z-10 w-full flex flex-col scroll-mt-24 h-[650px]"
              >
                <div className="mb-6">
                  <h2 className="text-xl md:text-3xl uppercase font-semibold inline border-b-2 border-white">
                    CONTACT US
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scroll">
                  <form
                    onSubmit={handleContactSubmit}
                    className="flex flex-col w-full"
                  >
                    <input
                      type="text"
                      name="name"
                      placeholder="NAME"
                      required
                      value={contactForm.name}
                      onChange={handleContactChange}
                      className="w-full bg-transparent border border-white text-white p-3 mb-4 rounded-md focus:ring-2 focus:ring-yellow-500"
                    />

                    <input
                      type="email"
                      name="email"
                      placeholder="EMAIL"
                      required
                      value={contactForm.email}
                      onChange={handleContactChange}
                      className="w-full bg-transparent border border-white text-white p-3 mb-4 rounded-md focus:ring-2 focus:ring-yellow-500"
                    />

                    <input
                      type="text"
                      name="company"
                      placeholder="COMPANY"
                      required
                      value={contactForm.company}
                      onChange={handleContactChange}
                      className="w-full bg-transparent border border-white text-white p-3 mb-4 rounded-md focus:ring-2 focus:ring-yellow-500"
                    />

                    <select
                      name="category"
                      required
                      value={contactForm.category}
                      onChange={handleContactChange}
                      className="w-full bg-transparent border border-white text-white p-3 mb-4 rounded-md focus:ring-2 focus:ring-yellow-500"
                    >
                      <option className="text-black" value="General Inquiry">
                        General Inquiry
                      </option>
                      <option
                        className="text-black"
                        value="Training / Registration"
                      >
                        Training / Registration
                      </option>
                      <option className="text-black" value="Technical Support">
                        Technical Support
                      </option>
                      <option
                        className="text-black"
                        value="Partnership / Collaboration"
                      >
                        Partnership / Collaboration
                      </option>
                      <option className="text-black" value="Feedback">
                        Feedback
                      </option>
                      <option className="text-black" value="Other">
                        Other
                      </option>
                    </select>

                    <textarea
                      name="message"
                      placeholder="MESSAGE"
                      required
                      value={contactForm.message}
                      onChange={handleContactChange}
                      className="w-full bg-transparent border border-white text-white p-3 mb-4 rounded-md focus:ring-2 focus:ring-yellow-500 min-h-[120px]"
                    />

                    <button
                      type="submit"
                      disabled={contactStatus.loading}
                      className="w-full bg-white text-black py-3 px-6 font-bold rounded-md hover:bg-yellow-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {contactStatus.loading ? "SENDING..." : "SUBMIT"}
                    </button>

                    {contactStatus.message && (
                      <p
                        className={`mt-3 text-sm ${
                          contactStatus.ok ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {contactStatus.message}
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {loginMessage && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <div className="bg-black/80 text-white text-lg px-6 py-4 rounded-lg shadow-lg text-center">
              {loginMessage}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Body;
