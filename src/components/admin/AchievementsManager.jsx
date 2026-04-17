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
  category: "Recognition",
  organization: "",
  date: "",
  imageUrl: "",
  bgColor: "#7a0000",
  isPublished: false,
  featured: false,
  details: "",
  descriptionText: "",
  priority: "Medium",
};

const AchievementsManager = () => {
  const [achievements, setAchievements] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);
  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    const achievementsRef = collection(db, "achievements");
    const q = query(achievementsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));
        setAchievements(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching achievements:", error);
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
      category: item.category || "Recognition",
      organization: item.organization || "",
      date: item.date || "",
      imageUrl: item.imageUrl || "",
      bgColor: item.bgColor || "#7a0000",
      isPublished: item.isPublished || false,
      featured: item.featured || false,
      details: item.details || "",
      descriptionText: Array.isArray(item.description)
        ? item.description.join("\n")
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
      category: formData.category,
      organization: formData.organization.trim(),
      date: formData.date,
      imageUrl: formData.imageUrl.trim(),
      bgColor: formData.bgColor.trim() || "#7a0000",
      isPublished: formData.isPublished,
      featured: formData.featured,
      details: formData.details.trim(),
      description: formData.descriptionText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      priority: formData.priority || "Medium",
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "achievements", editingId), payload);
        alert("Achievement updated successfully.");
      } else {
        await addDoc(collection(db, "achievements"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        alert("Achievement added successfully.");
      }

      setFormData(initialForm);
      setSelectedImage(null);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving achievement:", error);
      alert("Failed to save achievement. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id, currentValue) => {
    try {
      await updateDoc(doc(db, "achievements", id), {
        isPublished: !currentValue,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating publish status:", error);
    }
  };

  const toggleFeatured = async (id, currentValue) => {
    try {
      await updateDoc(doc(db, "achievements", id), {
        featured: !currentValue,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating featured status:", error);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this achievement entry?"
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "achievements", id));
    } catch (error) {
      console.error("Error deleting achievement:", error);
    }
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-4xl font-bold text-red-900 mb-8">Achievements Manager</h1>

      <div ref={formRef} className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-red-900 mb-4">
          {editingId ? "Edit Achievement" : "Add Achievement"}
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
              placeholder="Outstanding Institutional Collaboration"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="Recognition">Recognition</option>
              <option value="Award">Award</option>
              <option value="Certification">Certification</option>
              <option value="Milestone">Milestone</option>
              <option value="Partnership">Partnership</option>
              <option value="Public Service">Public Service</option>
              <option value="Research">Research</option>
              <option value="Training">Training</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="UP Manila / Partner Organization"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Achievement Image
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
              Optional. You may save an achievement even without an image.
            </p>

            {formData.imageUrl && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2 break-all">
                  {formData.imageUrl}
                </p>
                <img
                  src={formData.imageUrl}
                  alt="Achievement preview"
                  className="w-40 h-24 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Accent / Footer Color
            </label>
            <input
              type="text"
              name="bgColor"
              value={formData.bgColor}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="#7a0000"
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
              Used to control public ordering.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Short Details
            </label>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Short explanation or summary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Description / Highlights
            </label>
            <textarea
              name="descriptionText"
              value={formData.descriptionText}
              onChange={handleChange}
              rows="6"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder={`Recognition for delivering innovative disaster preparedness training\nInstitutional milestone in DRRM-H collaboration`}
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
              Publish to public achievements page
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
              />
              Mark as featured
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
                ? "Update Achievement"
                : "Add Achievement"}
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
          Existing Achievement Entries
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading achievements...</p>
        ) : achievements.length === 0 ? (
          <p className="text-gray-500 italic">No achievement entries found.</p>
        ) : (
          <div className="space-y-4">
            {achievements.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    {item.title || "Untitled Achievement"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.category || "Recognition"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Organization:{" "}
                    <span className="font-medium">
                      {item.organization || "—"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Priority:{" "}
                    <span className="font-medium">
                      {item.priority || "Medium"}
                    </span>
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
                      Featured:{" "}
                      <span
                        className={
                          item.featured
                            ? "text-blue-600 font-medium"
                            : "text-gray-500"
                        }
                      >
                        {item.featured ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
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
                    onClick={() => toggleFeatured(item.id, item.featured)}
                    className={`px-4 py-2 rounded-lg text-white ${
                      item.featured
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {item.featured ? "Unfeature" : "Feature"}
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

export default AchievementsManager;