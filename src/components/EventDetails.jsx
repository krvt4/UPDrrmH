import { useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import News1 from "../assets/news (1).png";
import News2 from "../assets/news (2).png";
import News3 from "../assets/news (3).png";

function EventDetails() {
  const { id } = useParams();
  const location = useLocation();
  const event = location.state?.event;


  if (!event) {
    return <div className="text-center text-red-500">Event not found!</div>;
  }
  return (
    <main className="mt-20 px-6 md:px-16">
      {/* Breadcrumbs */}
      <div className="flex items-center text-black font-semibold py-4 text-sm md:text-base">
        <Link to="/" className="hover:text-red-900">Home</Link>
        <span className="mx-2 text-red-900 font-bold">&gt;&gt;</span>
        <Link to="/events" className="hover:text-red-900">Events</Link>
        <span className="mx-2 text-red-900 font-bold">&gt;&gt;</span>
        <p className="text-red-900">{event.title}</p>
      </div>


      {/* Event Content */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{event.title}</h1>
        <p className="text-gray-600 text-sm md:text-base mt-2">Date: {event.date}</p>
        <p className="text-gray-600 text-sm md:text-base">Duration: {event.duration}</p>


        {/* Event Description */}
        <div className="mt-6">
          <p className="text-base md:text-lg leading-relaxed text-gray-800">
            {event.description || "No additional details available."}
          </p>
        </div>
      </div>
    </main>
  );
}


// ✅ Corrected export to match function name
export default EventDetails;