import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { FaEdit, FaTrash, FaEye, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';
import './MyHostels.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const MyHostels = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hostels/admin/my-hostels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setHostels(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hostel?')) return;

    try {
      const response = await fetch(`${API_URL}/api/hostels/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setHostels(hostels.filter(h => h._id !== id));
        alert('Hostel deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting hostel:', error);
      alert('Failed to delete hostel');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading hostels...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="my-hostels">
        <div className="page-header">
          <div>
            <h1>My Hostels</h1>
            <p>Manage all your hostel listings</p>
          </div>
          <button className="btn-add" onClick={() => navigate('/admin/add-hostel')}>
            Add New Hostel
          </button>
        </div>

        {hostels.length === 0 ? (
          <div className="no-hostels">
            <p>You haven't added any hostels yet.</p>
            <button className="btn-primary" onClick={() => navigate('/admin/add-hostel')}>
              Add Your First Hostel
            </button>
          </div>
        ) : (
          <div className="hostels-grid">
            {hostels.map((hostel) => (
              <div key={hostel._id} className="hostel-card">
                <div className="hostel-image">
                  {hostel.images && hostel.images.length > 0 ? (
                    <img src={hostel.images[0].url} alt={hostel.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="hostel-details">
                  <h3>{hostel.name}</h3>
                  <div className="hostel-info">
                    <div className="info-item">
                      <FaMapMarkerAlt />
                      <span>{hostel.address}</span>
                    </div>
                    <div className="info-item">
                      <FaRupeeSign />
                      <span>₹{hostel.price}/month</span>
                    </div>
                  </div>
                  <p className="hostel-description">{hostel.description.substring(0, 100)}...</p>
                  <div className="hostel-actions">
                    <button 
                      className="action-btn btn-view"
                      onClick={() => navigate(`/hostels/${hostel._id}`)}
                    >
                      <FaEye /> View
                    </button>
                    <button 
                      className="action-btn btn-edit"
                      onClick={() => navigate(`/admin/edit-hostel/${hostel._id}`)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button 
                      className="action-btn btn-delete"
                      onClick={() => handleDelete(hostel._id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default MyHostels;
