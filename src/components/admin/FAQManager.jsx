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
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const FAQManager = () => {
  const [faqs, setFaqs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [view, setView] = useState("list");
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchFaqs = async () => {
    const snapshot = await getDocs(collection(db, "faqs"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setFaqs(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // UPDATE
        await updateDoc(doc(db, "faqs", editingId), {
          question,
          answer,
          updatedAt: serverTimestamp(),
        });
        alert("FAQ updated successfully!");
      } else {
        // CREATE
        await addDoc(collection(db, "faqs"), {
          question,
          answer,
          createdAt: serverTimestamp(),
        });
        alert("FAQ added successfully!");
      }

      setView("list");
      setQuestion("");
      setAnswer("");
      setEditingId(null);
      fetchFaqs();
    } catch (error) {
      console.error("Error submitting FAQ:", error);
      alert("Failed to submit FAQ.");
    }
  };

  const deleteFaq = async (id) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        await deleteDoc(doc(db, "faqs", id));
        alert("FAQ deleted.");
        fetchFaqs();
        if (selectedFaq?.id === id) setView("list");
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete.");
      }
    }
  };

  const startEdit = (faq) => {
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setEditingId(faq.id);
    setView("form");
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full">
      {view === "list" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-red-900">Frequently Asked Questions</h2>
            <button
              onClick={() => {
                setView("form");
                setEditingId(null);
                setQuestion("");
                setAnswer("");
              }}
              className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900"
            >
              + Add FAQ
            </button>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white shadow rounded p-4 relative"
              >
                <div className="flex justify-between items-center">
                  <h3 
                    className="font-bold text-lg text-red-800 cursor-pointer"
                    onClick={() => toggleExpand(faq.id)}
                  >
                    {faq.question}
                  </h3>
                  <button onClick={() => toggleExpand(faq.id)}>
                    {expandedId === faq.id ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>
                
                {expandedId === faq.id && (
                  <>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => startEdit(faq)}
                        title="Edit"
                        className="flex gap-2 items-center text-center bg-yellow-500 p-2 text-white rounded hover:text-blue-800"
                      >
                        <Pencil size={18} /> Edit
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        title="Delete"
                        className="flex gap-2 items-center text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
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
            ← Back to FAQs List
          </button>
          <h2 className="text-2xl font-bold mb-4 text-red-900">
            {editingId ? "Edit FAQ" : "Add New FAQ"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Question</label>
              <input
                className="w-full border px-3 py-2 rounded"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Answer</label>
              <textarea
                className="w-full border px-3 py-2 rounded h-40"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900"
            >
              {editingId ? "Update FAQ" : "Submit FAQ"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FAQManager;