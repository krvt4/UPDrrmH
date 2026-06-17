import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Pencil, Trash2 } from "lucide-react";

const tagOptions = ["Health", "Emergency", "Response", "Training", "Agenda"];

const NewsPost = () => {
  const [newsList, setNewsList] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [tags, setTags] = useState([]);
  const [view, setView] = useState("list"); 
  const [selectedNews, setSelectedNews] = useState(null);
  const [editingId, setEditingId] = useState(null); 
  const [imageFile, setImageFile] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
const [selectedImage, setSelectedImage] = useState(null);

{/* Image Upload */}
const handleImageUpload = async (e) => {
    const files = e.target.files;
    const formData = new FormData();
  
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
  
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });
  
    const data = await res.json();
  
    if (res.ok) {
      const fullUrls = data.imageUrls.map((url) => `${import.meta.env.VITE_API_BASE_URL}${url}`);
      setImageUrls((prev) => [...prev, ...fullUrls]);
    } else {
      alert("Image upload failed");
    }
  };
  
{/* Fetches News */}
  const fetchNews = async () => {
    const snapshot = await getDocs(collection(db, "news"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setNewsList(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCheckboxChange = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // UPDATE
        await updateDoc(doc(db, "news", editingId), {
          title,
          content,
          image: imageUrls[0] || "",
          tags,
          readTime: `${Math.ceil(content.split(" ").length / 200)} min read`,
        });
        alert("News updated successfully!");
      } else {
        // CREATE
        await addDoc(collection(db, "news"), {
          title,
          content,
          image: imageUrls[0] || "", 
          tags,
          date: new Date().toLocaleDateString(),
          readTime: `${Math.ceil(content.split(" ").length / 200)} min read`,
          createdAt: serverTimestamp(),
        });
        alert("News posted successfully!");
      }

      setView("list");
      setTitle("");
      setContent("");
      setImage("");
      setTags([]);
      setEditingId(null);
      fetchNews();
    } catch (error) {
      console.error("Error submitting news:", error);
      alert("Failed to submit news.");
    }
  };

  const deleteNews = async (id) => {
    if (window.confirm("Are you sure you want to delete this news item?")) {
      try {
        await deleteDoc(doc(db, "news", id));
        alert("News deleted.");
        fetchNews();
        if (selectedNews?.id === id) setView("list");
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete.");
      }
    }
  };

  const startEdit = (news) => {
    setTitle(news.title);
    setContent(news.content);
    setImage(news.image);
    setTags(news.tags);
    setEditingId(news.id);
    setView("form");
  };

  return (
    /* List View */

    <div className="w-full">
      {view === "list" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-red-900">News Posts</h2>
            <button
              onClick={() => {
                setView("form");
                setEditingId(null);
                setTitle("");
                setContent("");
                setImage("");
                setTags([]);
              }}
              className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 cursor-pointer"
            >
              + Add News
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {newsList.map((news) => (
              <div
                key={news.id}
                className="bg-white shadow rounded p-4 relative"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedNews(news);
                    setView("detail");
                  }}
                >
                  {news.image && (
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-40 object-cover mb-2 rounded"
                    />
                  )}
                  <h3 className="font-bold text-lg text-red-800 mb-1">
                    {news.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                  {news.createdAt?.toDate().toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }) || "N/A"} • {news.readTime}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {news.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => startEdit(news)}
                      title="Edit"
                      className="flex gap-2 text-center bg-yellow-500 p-2 text-white rounded hover:text-blue-800 cursor-pointer"
                    >
                      <Pencil size={18} /> Edit
                    </button>
                    <button
                      onClick={() => deleteNews(news.id)}
                      title="Delete"
                      className="text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Detail View */}

      {view === "detail" && selectedNews && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setView("list")}
              className="text-gray-500 hover:text-red-900 underline cursor-pointer"
            >
              ← Back to News List
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => startEdit(selectedNews)}
                className="text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={() => deleteNews(selectedNews.id)}
                className="text-red-600 hover:text-red-800 cursor-pointer"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            {selectedNews.image && (
              <img
                src={selectedNews.image}
                alt={selectedNews.title}
                className="w-full h-60 object-cover rounded mb-4"
              />
            )}
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              {selectedNews.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
            {selectedNews.createdAt?.toDate().toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }) || "N/A"} • {selectedNews.readTime}
            </p>
            <div className="flex gap-2 mb-4">
              {selectedNews.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{selectedNews.content}</p>
          </div>
        </div>
      )}

      {/* Form View */}
      {view === "form" && (
        <div>
          <button
            onClick={() => {
              setView("list");
              setEditingId(null);
            }}
            className="mb-4 text-gray-500 hover:text-red-900 underline cursor-pointer"
          >
            ← Back to News List
          </button>
          <h2 className="text-2xl font-bold mb-4 text-red-900">
            {editingId ? "Edit News" : "Post New News"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Title</label>
              <input
                className="w-full border px-3 py-2 rounded"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Content</label>
              <textarea
                className="w-full border px-3 py-2 rounded h-40"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <div className="md:flex gap-2 w-full mb-4">
                <label className="py-2 w-full md:w-1/8 font-bold">Upload Image:</label>
                <div>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 space-x-2 mt-2">
                      {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                          <img
                              src={url}
                              alt={`Uploaded ${index}`}
                              className="w-24 h-24 cursor-pointer hover:scale-105 transition-transform rounded"
                              onClick={() => setSelectedImage(url)}
                          />
                          <button
                              onClick={(e) => {
                              e.stopPropagation();
                              setImageUrls(imageUrls.filter((_, i) => i !== index));
                              }}
                              className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              ✖
                          </button>
                          </div>
                        ))}

                          <label
                              htmlFor="fileInput"
                              className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 outline-none rounded cursor-pointer hover:bg-gray-100"
                          >
                              <span className="text-gray-400 text-sm">+</span>
                              <span className="text-gray-400 text-xs">Add Photo</span>
                          </label>
                          <input
                              id="fileInput"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                          />
                    </div>

                    {selectedImage && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-30"
                        onClick={() => setSelectedImage(null)}
                    >
                        <img
                        src={selectedImage}
                        alt="Zoomed"
                        className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
                        />
                    </div>
                    )}
                </div>
                </div>

            <div>
              <label className="block text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-4">
                {tagOptions.map((tag) => (
                  <label key={tag} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tags.includes(tag)}
                      onChange={() => handleCheckboxChange(tag)}
                      className="cursor-pointer accent-red-900"
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900 cursor-pointer"
            >
              {editingId ? "Update News" : "Submit News"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default NewsPost;