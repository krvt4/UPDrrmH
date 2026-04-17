import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Calendar } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase"; // adjust the path as needed


function News() {
  const location = useLocation();
  const selectedCategoryFromDetail = location.state?.selectedCategory || "";
  const [newsData, setNewsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState(selectedCategoryFromDetail);
  const [filter, setFilter] = useState("Today");

  // Filtered news based on search, category, and other filters
  const filteredNews = newsData
    .filter((news) => news.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((news) => !category || news.tags.includes(category));

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
  
      fetchNews();
    }, []);

  return (
    <main className="bg-white text-black">
      <section className="mt-20 mb-8 p-4">
        {/* Breadcrumb */}
        <div className="flex justify-between items-center">
          <nav aria-label="breadcrumb">
                    <div className="flex md:flex-row md:items-center text-gray-500 text-sm md:text-base">
                        <Link to="/" className="hover:text-red-900">Home</Link>
                        <span className="mx-2 text-black font-bold">&gt;&gt;</span>
                        <Link to="/news" className="hover:text-red-900">News</Link>
                    </div>
                  </nav>
        </div>
        
        <h2 className="font-semibold text-red-900 uppercase text-left py-4">News</h2>

        {/* Search & Filter Section */}
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
          {/* Search Bar */}  
          <div className="flex items-center border border-zinc-300 rounded-lg gap-2 p-2 flex-grow">
            <Search className="text-gray-500" size={20}/>
              <input
                type="text"
                placeholder="Search news..."
                className=" w-full md:w-1/3 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
            
          <div className="flex space-x-4">
            {/* Category Dropdown */}
            <select
              className="p-2 border border-zinc-300 outline-none rounded-md"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Health">Health</option>
              <option value="Emergency">Emergency</option>
              <option value="Training">Training</option>
              <option value="Response">Response</option>
            </select>


            {/* Date Filter Dropdown */}
            <select
              className="p-2 border border-zinc-300 outline-none rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="Today">Today’s News</option>
              <option value="Week">This Week</option>
              <option value="Month">This Month</option>
            </select>
          </div>
        </div>

        {/* News List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {filteredNews.length > 0 ? (
            filteredNews.map((news) => (
              <Link
                key={news.id}
                to={`/news/${news.id}`}
                state={{ news }}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
              >
                <img
                  src={news.image}
                  alt={news.title}
                  className="h-40 w-full object-cover rounded-md"
                />

                <h3 className="text-xl font-semibold mt-2 text-gray-800 hover:text-red-900">
                  {news.title}
                </h3>
                <p className="flex items-center text-gray-600 text-sm my-3"><Calendar size={20} className="mr-1"/>{news.createdAt?.toDate().toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }) || "N/A"} • {news.readTime}</p>
                <div className="mt-2">
                  {news.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-200 rounded-full px-2 py-1 mr-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-600 text-center col-span-3">No news found.</p>
          )}
        </div>
      </section>
    </main>
  );
}


export default News;