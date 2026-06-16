import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

const initialForm = {
  title: "",
  type: "Internship",
  imageUrl: "",
  bgColor: "#06441f",
  accepting: false,
  isPublished: false,
  details: "",
  descriptionText: "",
  requirementsText: "",
  priority: "Medium",
};

const CareersManager = () => {
  const [careers, setCareers] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);
  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    const careersRef = collection(db, "careers");
    const q = query(careersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));
        setCareers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching careers:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedImage(file);
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      alert("Please select an image first.");
      return;
    }

    try {
      setUploadingImage(true);

      const data = new FormData();
      data.append("images", selectedImage);

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      const uploadedUrl = `${API_BASE}${result.imageUrls[0]}`;

      setFormData((prev) => ({
        ...prev,
        imageUrl: uploadedUrl,
      }));

      alert("Image uploaded successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || "",
      type: item.type || "Internship",
      imageUrl: item.imageUrl || "",
      bgColor: item.bgColor || "#06441f",
      accepting: item.accepting || false,
      isPublished: item.isPublished || false,
      details: item.details || "",
      descriptionText: Array.isArray(item.description)
        ? item.description.join("\n")
        : "",
      requirementsText: Array.isArray(item.requirements)
        ? item.requirements.join("\n")
        : "",
      priority: item.priority || "Medium",
    });
    setSelectedImage(null);
    setTimeout(() => {
  formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}, 100);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
    setSelectedImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: formData.title.trim(),
      type: formData.type,
      imageUrl: formData.imageUrl.trim(),
      bgColor: formData.bgColor.trim() || "#06441f",
      accepting: formData.accepting,
      isPublished: formData.isPublished,
      details: formData.details.trim(),
      description: formData.descriptionText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      requirements: formData.requirementsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      priority: formData.priority || "Medium",
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "careers", editingId), payload);
        alert("Career template updated successfully.");
      } else {
        await addDoc(collection(db, "careers"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        alert("Career template added successfully.");
      }

      setFormData(initialForm);
      setSelectedImage(null);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving career:", error);
      alert("Failed to save career template. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id, currentValue) => {
    try {
      await updateDoc(doc(db, "careers", id), {
        isPublished: !currentValue,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating publish status:", error);
    }
  };

  const toggleAccepting = async (id, currentValue) => {
    try {
      await updateDoc(doc(db, "careers", id), {
        accepting: !currentValue,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating accepting status:", error);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this career entry?"
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "careers", id));
    } catch (error) {
      console.error("Error deleting career:", error);
    }
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-4xl font-bold text-red-900 mb-8">Career Manager</h1>

     <div ref={formRef} className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-red-900 mb-4">
          {editingId ? "Edit Career Template" : "Add Career Template"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Frontend Developer Intern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="Internship">Internship</option>
              <option value="Job Opportunity">Job Opportunity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Career Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />

            <button
              type="button"
              onClick={handleImageUpload}
              disabled={!selectedImage || uploadingImage}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {uploadingImage ? "Uploading..." : "Upload Image"}
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Optional. You may save a career template even without an image.
            </p>

            {formData.imageUrl && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2 break-all">
                  {formData.imageUrl}
                </p>
                <img
                  src={formData.imageUrl}
                  alt="Career preview"
                  className="w-40 h-24 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Footer Background Color
            </label>
            <input
              type="color"
              name="bgColor"
              value={formData.bgColor}
              onChange={handleChange}
              className="w-45 h-10 cursor-pointer"
              placeholder="#06441f"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Display Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Used only in admin to control public ordering.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Details</label>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Short explanation about the role"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description / Qualifications
            </label>
            <textarea
              name="descriptionText"
              value={formData.descriptionText}
              onChange={handleChange}
              rows="6"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder={`Knowledge in React\nKnowledge in Firebase\nBasic UI/UX understanding`}
            />
            <p className="text-xs text-gray-500 mt-1">One item per line</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Requirements
            </label>
            <textarea
              name="requirementsText"
              value={formData.requirementsText}
              onChange={handleChange}
              rows="6"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder={`Resume or CV\nPortfolio (if available)`}
            />
            <p className="text-xs text-gray-500 mt-1">One item per line</p>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
              />
              Publish to public careers page
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="accepting"
                checked={formData.accepting}
                onChange={handleChange}
              />
              Accepting applications
            </label>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-red-900 hover:bg-red-800 text-white px-5 py-2 rounded-lg"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Career Template"
                : "Add Career Template"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-red-900 mb-4">
          Existing Career Entries
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading career entries...</p>
        ) : careers.length === 0 ? (
          <p className="text-gray-500 italic">No career entries found.</p>
        ) : (
          <div className="space-y-4">
            {careers.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    {item.title || "Untitled Career"}
                  </h3>
                  <p className="text-sm text-gray-600">{item.type}</p>
                  <p className="text-sm text-gray-600">
                    Priority: <span className="font-medium">{item.priority || "Medium"}</span>
                  </p>

                  <div className="mt-2 text-sm">
                    <p>
                      Visibility:{" "}
                      <span
                        className={
                          item.isPublished
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                        }
                      >
                        {item.isPublished ? "Published" : "Hidden"}
                      </span>
                    </p>
                    <p>
                      Applications:{" "}
                      <span
                        className={
                          item.accepting
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                        }
                      >
                        {item.accepting ? "Open" : "Closed"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => togglePublish(item.id, item.isPublished)}
                    className={`px-4 py-2 rounded-lg text-white ${
                      item.isPublished
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {item.isPublished ? "Hide" : "Publish"}
                  </button>

                  <button
                    onClick={() => toggleAccepting(item.id, item.accepting)}
                    className={`px-4 py-2 rounded-lg text-white ${
                      item.accepting
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {item.accepting
                      ? "Close Applications"
                      : "Open Applications"}
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 rounded-lg text-white bg-red-700 hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareersManager;