import React, { useEffect } from "react";
import { ExternalLink, FolderKanban } from "lucide-react";
import projectsBg from "../assets/careers-redbg.png";

function Projects() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const projects = [
    {
      id: 1,
      title: "Project Alpha",
      description:
        "A standalone DRRM-related platform for simulation, learning, and public engagement",
      image: projectsBg,
      url: "https://your-project-alpha-url.com",
      status: "Live",
      category: "External Website",
    },
    {
      id: 2,
      title: "Project Beta",
      description:
        "An independent project website focused on disaster preparedness resources and digital tools",
      image: projectsBg,
      url: "https://your-project-beta-url.com",
      status: "Live",
      category: "External Website",
    },
    {
      id: 3,
      title: "Project Gamma",
      description:
        "A separate web platform that can be maintained and deployed independently from the main DRRM-H site",
      image: projectsBg,
      url: "https://your-project-gamma-url.com",
      status: "Coming Soon",
      category: "External Website",
    },
  ];

  return (
    <main
      className="min-h-screen bg-gray-100 overflow-x-hidden"
      style={{ fontFamily: '"Montserrat", sans-serif' }}
    >
      <section
        className="relative w-full min-h-[58vh] bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-16"
        style={{ backgroundImage: `url(${projectsBg})` }}
      >
        <div className="absolute inset-0 bg-[#7B1113]/45" />

        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="bg-white/20 backdrop-blur-xl rounded-xl shadow-2xl px-6 md:px-10 py-8 md:py-10 text-center text-white border border-white/10">
            <h1 className="text-2xl md:text-4xl font-bold tracking-wide">
              PROJECTS
            </h1>

            <p className="mt-4 text-sm md:text-base leading-relaxed max-w-3xl mx-auto">
              Explore DRRM-H related platforms, digital initiatives, and
              standalone websites connected to our work in disaster risk
              reduction and management in health
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-7xl mx-auto">
          <div className="p-6 md:p-10 text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-red-900">
              Featured Projects
            </h2>

            <p className="mt-4 text-sm md:text-base text-gray-700 max-w-4xl mx-auto leading-relaxed">
              This page serves as a hub for separate project websites and
              digital platforms. Each project can be developed, deployed, and
              maintained independently while remaining connected to the main
              DRRM-H website
            </p>
          </div>
        </div>
      </section>

      <section className="pb-14 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-full"
              >
                <div className="w-full h-56 bg-gray-200 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className="h-14 w-14 rounded-full flex items-center justify-center bg-red-50">
                      <FolderKanban size={26} className="text-red-900" />
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold text-red-900 text-center leading-snug">
                    {project.title}
                  </h3>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                    <span className="inline-flex rounded-full bg-red-100 text-red-900 px-3 py-1 text-xs font-semibold">
                      {project.category}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        project.status === "Live"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="mt-4 text-sm md:text-base text-gray-700 leading-relaxed text-center">
                    {project.description}
                  </p>

                  <div className="mt-auto pt-6">
                    {project.status === "Live" ? (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-red-900 hover:bg-red-800 text-white font-semibold px-4 py-3 rounded-lg transition"
                      >
                        <span>Visit Project</span>
                        <ExternalLink size={18} />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full inline-flex items-center justify-center bg-gray-300 text-gray-600 font-semibold px-4 py-3 rounded-lg cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Projects;