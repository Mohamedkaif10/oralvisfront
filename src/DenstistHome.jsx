import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
const DentistHome = ({ onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const userId = localStorage.getItem("userId");

  // const socket = io("http://localhost:8000");
  const socket = io("https://oralvisbackend.onrender.com")
  console.log("the userId is", userId);

  useEffect(() => {
    if (userId) {
      socket.emit("join", userId);
      console.log("Joined room:", userId);
    }

    socket.on("checkup_request", async (requestData) => {
      console.log("Received checkup request:", requestData);

      try {
        const response = await fetch(
          // `http://localhost:8000/api/auth/user/${requestData.userId}`,
          `https://oralvisbackend.onrender.com/api/auth/user/${requestData.userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const userData = await response.json();
        if (response.ok) {
          setRequests((prev) => [
            ...prev,
            {
              _id: requestData._id,
              userId: { email: userData.email },
              status: requestData.status,
              createdAt: requestData.createdAt,
              hasPhoto: false,
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching user email:", err);
      }
    });

    return () => {
      socket.off("checkup_request");
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(
          // "http://localhost:8000/api/checkup/requests",
          "https://oralvisbackend.onrender.com/api/checkup/requests",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setRequests(data);
        } else {
          setError(data.message || "Failed to fetch requests");
        }
      } catch (err) {
        setError("Network error");
      }
    };
    fetchRequests();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (checkupRequestId) => {
    if (!photo || !description) {
      setError("Please select a photo and add a description");
      return;
    }
    try {
      const reader = new FileReader();
      reader.readAsDataURL(photo);
      reader.onloadend = async () => {
        const base64Photo = reader.result;
        const response = await fetch(
          // "http://localhost:8000/api/checkup/photo",
          "https://oralvisbackend.onrender.com/api/checkup/photo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              checkupRequestId,
              photo: base64Photo,
              description,
            }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setMessage(data.message);
          setError("");
          setPhoto(null);
          setPhotoPreview("");
          setDescription("");
          setSelectedRequestId(null);

          const updatedResponse = await fetch(
            // "http://localhost:8000/api/checkup/requests",
            "https://oralvisbackend.onrender.com/api/checkup/requests",
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const updatedData = await updatedResponse.json();
          if (updatedResponse.ok) {
            setRequests(updatedData);
          }
        } else {
          setError(data.message || "Failed to upload photo");
        }
      };
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-500 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dentist Dashboard</h1>
        <button
          onClick={onLogout}
          className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <div className="p-8">
        <h2 className="text-xl mb-4">Welcome, Dentist!</h2>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Checkup Requests</h3>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && <p className="text-green-500 mb-4">{message}</p>}
          {requests.length === 0 ? (
            <p className="text-gray-600">No checkup requests yet.</p>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.userId.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {request.hasPhoto ? (
                          <span className="text-green-600">Uploaded</span>
                        ) : selectedRequestId === request._id ? (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="mb-2"
                            />
                            {photoPreview && (
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-24 h-24 object-cover mb-2"
                              />
                            )}
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Add description"
                              className="w-full px-3 py-2 border rounded-lg mb-2"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpload(request._id)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                              >
                                Upload
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequestId(null);
                                  setPhoto(null);
                                  setPhotoPreview("");
                                  setDescription("");
                                  setError("");
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedRequestId(request._id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                          >
                            Add Photo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p>Other features:</p>
        <ul className="list-disc ml-6">
          <li>Manage patient records</li>
          <li>Update availability</li>
        </ul>
      </div>
    </div>
  );
};

export default DentistHome;
