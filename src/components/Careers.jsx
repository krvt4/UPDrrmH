import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import CareersBG from "../assets/careers-redbg.png";
import { Check } from "lucide-react";
import { db } from "../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const Careers = () => {
  const [careerData, setCareerData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCareers = async () => {
      try {
        const q = query(
          collection(db, "careers"),
          where("isPublished", "==", true)
        );

        const snapshot = await getDocs(q);

        const priorityOrder = {
          High: 1,
          Medium: 2,
          Low: 3,
        };

        const careers = snapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }))
          .sort((a, b) => {
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;

            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }

            const aCreatedAt = a.createdAt?.seconds || 0;
            const bCreatedAt = b.createdAt?.seconds || 0;

            return bCreatedAt - aCreatedAt;
          });

        setCareerData(careers);
      } catch (error) {
        console.error("Error fetching careers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCareers();
  }, []);

  return (
    <>
      <Header />

      <section
        className="w-full min-h-[60vh] bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-16"
        style={{ backgroundImage: `url(${CareersBG})` }}
      >
        <div className="bg-white/20 backdrop-blur-xl p-6 md:p-10 rounded-xl shadow-2xl max-w-4xl mx-auto text-center text-white">
          <h1 className="text-2xl md:text-4xl font-bold">Career Openings</h1>
          <p className="mt-4 text-sm md:text-base">
            Join the UP Manila DRRM-H Program as we seek motivated individuals
            from various fields to support our dynamic, technology-driven
            disaster preparedness initiatives. This is an exciting opportunity
            to contribute to national resilience through virtual reality,
            research, community engagement, and systems development.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100">
        {loading ? (
          <div className="max-w-7xl mx-auto text-center text-gray-500">
            Loading career openings...
          </div>
        ) : careerData.length === 0 ? (
          <div className="max-w-7xl mx-auto text-center text-gray-500 italic">
            No published career openings at this time.
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {careerData.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-full"
              >
                <div className="p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-red-900 mb-4 text-center">
                    {item.title || item.type}
                  </h2>

                  {item.imageUrl ? (
                    <div className="w-full h-48 sm:h-64 md:h-80 mb-6 mx-auto overflow-hidden rounded-lg">
                      <img
                        src={item.imageUrl}
                        alt={item.title || item.type}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}

                  {item.details ? (
                    <div className="mb-6">
                      <p className="text-sm text-gray-700 leading-relaxed text-center">
                        {item.details}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 w-full text-left">
                    <p className="font-bold text-xs text-gray-800 mb-2">
                      {item.type === "Internship"
                        ? "Open for the following courses"
                        : "Open for the following qualifications"}
                    </p>
                    <hr className="border-t border-gray-300 mb-4" />

                    <ul className="space-y-3">
                      {Array.isArray(item.description) &&
                      item.description.length > 0 ? (
                        item.description.map((desc, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <div className="pt-1">
                              <Check className="text-red-800 w-4 h-4" />
                            </div>
                            <p className="font-medium text-sm text-red-900 leading-snug">
                              {desc}
                            </p>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500 italic">
                          No details available at this time
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-6 w-full text-left">
                    <p className="font-bold text-xs text-gray-800 mb-2">
                      Requirements
                    </p>
                    <hr className="border-t border-gray-300 mb-4" />

                    <ul className="space-y-3">
                      {Array.isArray(item.requirements) &&
                      item.requirements.length > 0 ? (
                        item.requirements.map((req, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <div className="pt-1">
                              <Check className="text-red-800 w-4 h-4" />
                            </div>
                            <p className="font-medium text-sm text-red-900 leading-snug">
                              {req}
                            </p>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500 italic">
                          No specific requirements at this time
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div
                  className="text-white rounded-b-lg px-4 py-3 mt-auto text-center"
                  style={{ backgroundColor: item.bgColor || "#7a0000" }}
                >
                  {item.accepting
                    ? "Now accepting applications!"
                    : "Not accepting applications at the moment."}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-7xl mx-auto mt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 md:p-10">
            <div className="w-full md:w-1/2">
              <h2 className="text-xl md:text-2xl font-bold text-red-900 text-center md:text-left">
                Think you got what it takes to join our team?
              </h2>
            </div>

            <div className="w-full md:w-1/2">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-700 mb-4">
                  Send your CV or resume to: upm-drrmh-list@up.edu.ph
                  <br />
                  email subject: [Internship Application] Last Name
                </p>
                <p className="text-sm text-gray-700">
                  For inquiries, message us through our official{" "}
                  <a
                    href="https://www.facebook.com/UPSimulationCenter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Facebook page
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Careers;