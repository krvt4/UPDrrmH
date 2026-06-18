import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  getDocs as getDocsQuery,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Calendar } from "lucide-react";

function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Try getting the document directly by Firestore doc.id
        const docRef = doc(db, "news", id);
        const docSnap = await getDoc(docRef);

        let newsData = null;

        if (docSnap.exists()) {
          newsData = { id: docSnap.id, ...docSnap.data() };
        } else {
          // 2) Fallback: try finding by a custom field (CHANGE "newsId" if needed)
          const q = query(
            collection(db, "news"),
            where("newsId", "==", id),
            limit(1)
          );

          const qSnap = await getDocsQuery(q);

          if (!qSnap.empty) {
            const found = qSnap.docs[0];
            newsData = { id: found.id, ...found.data() };
          }
        }

        if (!newsData) throw new Error("News not found");

        setNews(newsData);

        // Related news (exclude current doc.id)
        const allNewsSnap = await getDocs(collection(db, "news"));
        const allNews = allNewsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.id !== newsData.id);

        setRelatedNews(allNews);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [id]);

  const handleCategoryClick = (category) => {
    navigate("/news", { state: { selectedCategory: category } });
  };

  const paragraphs = useMemo(() => {
    return (news?.content || "")
      .split(/\n\s*\n/g)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [news]);

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  if (error || !news) {
    return (
      <div className="text-center mt-20">
        <p className="text-red-500">{error || "News not found!"}</p>
        <p className="mt-2">
          Go back to{" "}
          <Link className="text-[#04204a] underline" to="/news">
            News
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <main className="bg-gray-50">
      <section className="mt-20 mb-10 px-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="max-w-7xl mx-auto pt-4">
          <div className="flex flex-col md:flex-row md:items-center text-gray-500 text-sm md:text-base">
            <div className="flex items-center flex-wrap">
              <Link to="/" className="hover:text-[#7b1113]">
                Home
              </Link>
              <span className="mx-2 text-black font-bold">&gt;&gt;</span>
              <Link to="/news" className="hover:text-[#7b1113]">
                News
              </Link>
              <span className="mx-2 text-black font-bold">&gt;&gt;</span>
            </div>
            <p className="text-[#7b1113] font-semibold md:ml-2 mt-2 md:mt-0 break-words">
              {news.title}
            </p>
          </div>
        </nav>

        {/* Newspaper Layout */}
        <div className="max-w-7xl mx-auto py-6 grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-10">
          {/* Main Article */}
          <article className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 break-words">
              {news.title}
            </h1>

            <p className="flex items-center text-gray-500 text-sm md:text-base mt-3">
              <Calendar size={20} className="mr-2" />
              {news.createdAt?.toDate().toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }) || "N/A"}
            </p>

            {news.image && (
              <div className="mt-6">
                <img
                  src={news.image}
                  alt={news.title}
                  className="w-full h-auto max-h-[520px] object-cover rounded-2xl shadow-md"
                  loading="lazy"
                />
              </div>
            )}

            {/* Newspaper Text (2 columns on desktop via CSS class) */}
            <div className="mt-8 text-gray-800 news-article">
              <div className="news-columns">
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, idx) => (
                    <p key={idx} className="mb-4">
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="whitespace-pre-wrap">{news.content}</p>
                )}
              </div>
            </div>

            {news.purpose && (
              <div className="mt-10 border-t pt-6">
                <h2 className="text-xl font-bold text-gray-900">
                  PURPOSE OF THE COURSE
                </h2>
                <p className="mt-2 text-gray-700">{news.purpose}</p>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Related News
              </h2>

              <div className="space-y-4">
                {relatedNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 mb-1 line-clamp-2">
                        {item.title}
                      </p>

                      <p className="flex text-xs text-gray-500 items-center">
                        <Calendar size={16} className="mr-1" />
                        {item.createdAt?.toDate().toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }) || "N/A"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default NewsDetail;