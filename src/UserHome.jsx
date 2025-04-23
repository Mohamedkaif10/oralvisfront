import React, { useState, useEffect } from 'react';
import  jsPDF  from 'jspdf';
import { io } from 'socket.io-client';
const UserHome = ({ onLogout }) => {
  const [dentists, setDentists] = useState([]);
  const [selectedDentist, setSelectedDentist] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkupResults, setCheckupResults] = useState([]);
  const userId = localStorage.getItem('userId');
  const socket = io('http://localhost:8000');
  console.log('the userId is', userId);

  useEffect(() => {
    if (userId) {
      socket.emit('join', userId);
      console.log('Joined room:', userId);
    }

    socket.on('photo_uploaded', (photoData) => {
      console.log('Received photo upload:', photoData);
      setCheckupResults((prev) => [...prev, {
        _id: photoData._id,
        photo: photoData.photo,
        description: photoData.description,
        createdAt: photoData.createdAt,
        dentistId: { email: 'Loading...' } 
      }]);
    
      fetchCheckupResults();
    });

  
    return () => {
      socket.off('photo_uploaded');
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/checkup/dentists');
        const data = await response.json();
        if (response.ok) {
          setDentists(data);
        } else {
          setError(data.message || 'Failed to fetch dentists');
        }
      } catch (err) {
        setError('Network error');
      }
    };
    fetchDentists();
  }, []);
console.log("the token is ",localStorage.getItem('token'))


    const fetchCheckupResults = async () => {
      try {
       
         const response = await fetch(`http://localhost:8000/api/checkup/photos/${localStorage.getItem('userId')}`, 
            {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
           });
        const data = await response.json();
        if (response.ok) {
          setCheckupResults(data);
        } else {
          setError(data.message || 'Failed to fetch checkup results');
        }
      } catch (err) {
        setError('Network error');
      }
    };


  useEffect(() => {
    fetchCheckupResults();
  }, [userId]);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDentist) {
      setError('Please select a dentist');
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/checkup/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ dentistId: selectedDentist })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Checkup request submitted successfully');
        setError('');
        setSelectedDentist('');
      } else {
        setError(data.message || 'Failed to submit request');
      }
    } catch (err) {
      setError('Network error');
    }
  };

 
  const exportToPDF = () => {
    const doc = new jsPDF();
    let yOffset = 10;

    doc.setFontSize(16);
    doc.text('Checkup Results', 10, yOffset);
    yOffset += 10;

    checkupResults.forEach((result, index) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 10;
      }

      doc.setFontSize(12);
      doc.text(`Result ${index + 1}`, 10, yOffset);
      yOffset += 10;

      doc.text(`Dentist: ${result.dentistId.email}`, 10, yOffset);
      yOffset += 10;

      doc.text(`Date: ${new Date(result.createdAt).toLocaleDateString()}`, 10, yOffset);
      yOffset += 10;

      doc.text('Description:', 10, yOffset);
      yOffset += 10;
      const descriptionLines = doc.splitTextToSize(result.description, 180);
      doc.text(descriptionLines, 10, yOffset);
      yOffset += descriptionLines.length * 10;

      if (result.photo) {
        try {
          doc.addImage(result.photo, 'JPEG', 10, yOffset, 50, 50);
          yOffset += 60;
        } catch (err) {
          console.error('Error adding image to PDF:', err);
        }
      }

      yOffset += 10;
    });

    doc.save('checkup_results.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <button
          onClick={onLogout}
          className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <div className="p-8">
        <h2 className="text-xl mb-4">Welcome, User!</h2>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Book a Checkup</h3>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && <p className="text-green-500 mb-4">{message}</p>}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Select Dentist</label>
            <select
              value={selectedDentist}
              onChange={(e) => setSelectedDentist(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">-- Choose a dentist --</option>
              {dentists.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.email}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Submit Checkup Request
          </button>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Checkup Results</h3>
          {checkupResults.length === 0 ? (
            <p className="text-gray-600">No checkup results available.</p>
          ) : (
            <div>
              <button
                onClick={exportToPDF}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 mb-4"
              >
                Export to PDF
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkupResults.map((result) => (
                  <div key={result._id} className="bg-white p-4 rounded-lg shadow-md">
                    <img
                      src={result.photo}
                      alt="Checkup"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <p className="text-gray-700 mb-2">
                      <strong>Dentist:</strong> {result.dentistId.email}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong>Date:</strong> {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700">
                      <strong>Description:</strong> {result.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <p>Other features:</p>
        <ul className="list-disc ml-6">
          <li>View your appointment history</li>
          <li>Manage your profile</li>
        </ul>
      </div>
    </div>
  );
};

export default UserHome;