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
import { Pencil, Trash2, Star } from "lucide-react";

const ReviewsPost = () => {
  const [reviewsList, setReviewsList] = useState([]);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [view, setView] = useState("list");
  const [selectedReview, setSelectedReview] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchReviews = async () => {
    const snapshot = await getDocs(collection(db, "reviews"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setReviewsList(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // UPDATE
        await updateDoc(doc(db, "reviews", editingId), {
          name,
          profession,
          content,
          rating,
        });
        alert("Review updated successfully!");
      } else {
        // CREATE
        await addDoc(collection(db, "reviews"), {
          name,
          profession,
          content,
          rating,
          date: new Date().toLocaleDateString(),
          createdAt: serverTimestamp(),
        });
        alert("Review posted successfully!");
      }

      setView("list");
      setName("");
      setProfession("");
      setContent("");
      setRating(0);
      setEditingId(null);
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };

  const deleteReview = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, "reviews", id));
        alert("Review deleted.");
        fetchReviews();
        if (selectedReview?.id === id) setView("list");
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete.");
      }
    }
  };

  const startEdit = (review) => {
    setName(review.name);
    setProfession(review.profession);
    setContent(review.content);
    setRating(review.rating);
    setEditingId(review.id);
    setView("form");
  };

  const renderStars = (count, isEditable = false, size = 24) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`cursor-pointer ${isEditable ? "hover:scale-110" : ""}`}
          onClick={() => isEditable && setRating(star)}
          onMouseEnter={() => isEditable && setHoverRating(star)}
          onMouseLeave={() => isEditable && setHoverRating(0)}
        >
          <Star
            size={size}
            fill={
              isEditable 
                ? star <= (hoverRating || rating) 
                  ? "gold" 
                  : "transparent"
                : star <= count
                  ? "gold"
                  : "transparent"
            }
            color="gold"
          />
        </span>
      ))}
    </div>
  );
};

  return (
    <div className="w-full">
      {view === "list" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-red-900">Customer Reviews</h2>
            <button
              onClick={() => {
                setView("form");
                setEditingId(null);
                setName("");
                setProfession("");
                setContent("");
                setRating(0);
              }}
              className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900"
            >
              + Add Review
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {reviewsList.map((review) => (
              <div
                key={review.id}
                className="bg-white shadow rounded p-4 relative"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedReview(review);
                    setView("detail");
                  }}
                >
                  <h3 className="font-bold text-lg text-red-800 mb-1">
                    {review.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{review.profession}</p>
                  <div className="mb-2">
                    {renderStars(review.rating, false, 18)}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {review.content}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(review);
                      }}
                      title="Edit"
                      className="flex gap-2 text-center bg-yellow-500 p-2 text-white rounded hover:text-blue-800"
                    >
                      <Pencil size={18} /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReview(review.id);
                      }}
                      title="Delete"
                      className="text-red-600 hover:text-red-800"
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

      {view === "detail" && selectedReview && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setView("list")}
              className="text-red-700 underline"
            >
              ← Back to Reviews List
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => startEdit(selectedReview)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={() => deleteReview(selectedReview.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-red-900 mb-1">
                  {selectedReview.name}
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                  {selectedReview.profession}
                </p>
              </div>
              <div>
                {renderStars(selectedReview.rating, false, 28)}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedReview.createdAt?.toDate().toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }) || "N/A"}
            </p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {selectedReview.content}
            </p>
          </div>
        </div>
      )}

      {view === "form" && (
        <div>
          <button
            onClick={() => {
              setView("list");
              setEditingId(null);
            }}
            className="mb-4 text-red-700 underline"
          >
            ← Back to Reviews List
          </button>
          <h2 className="text-2xl font-bold mb-4 text-red-900">
            {editingId ? "Edit Review" : "Add New Review"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Name</label>
              <input
                className="w-full border px-3 py-2 rounded"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Profession</label>
              <input
                className="w-full border px-3 py-2 rounded"
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Rating</label>
              {renderStars(5, true)}
            </div>
            <div>
              <label className="block text-gray-700">Review Content</label>
              <textarea
                className="w-full border px-3 py-2 rounded h-40"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900"
            >
              {editingId ? "Update Review" : "Submit Review"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReviewsPost;