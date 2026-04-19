import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAdminApplications, updateApplicationStatus, deleteApplication } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import { FaFilter, FaEye, FaTrash } from 'react-icons/fa';
import './AdminApplications.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AdminApplications = () => {
  const { token } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    hostel: 'All'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, applications]);

  const fetchData = async () => {
    const [appsData, hostelsRes] = await Promise.all([
      getAdminApplications(),
      fetch(`${API_URL}/api/hostels/admin/my-hostels`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);
    
    const hostelsData = await hostelsRes.json();
    setApplications(appsData);
    setHostels(hostelsData);
    setFilteredApplications(appsData);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.status !== 'All') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.hostel !== 'All') {
      filtered = filtered.filter(app => app.hostelId._id === filters.hostel);
    }

    setFilteredApplications(filtered);
  };

  const handleStatusUpdate = async (id, status) => {
    await updateApplicationStatus(id, status);
    setSelectedApplication(null);
    fetchData();
  };

  const handleViewDetails = async (appId) => {
    try {
      const response = await fetch(`${API_URL}/api/applications/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSelectedApplication(data);
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteApplication(id);
      fetchData();
      alert('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading applications...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-applications-container">
        <div className="page-header">
          <div>
            <h1>Applications</h1>
            <p>Manage all hostel applications</p>
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <FaFilter />
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={filters.hostel}
              onChange={(e) => setFilters({...filters, hostel: e.target.value})}
            >
              <option value="All">All Hostels</option>
              {hostels.map(hostel => (
                <option key={hostel._id} value={hostel._id}>{hostel.name}</option>
              ))}
            </select>
          </div>

          <div className="results-count">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <p className="no-applications">No applications found.</p>
        ) : (
          <div className="admin-applications-list">
            {filteredApplications.map(app => (
            <div key={app._id} className="admin-app-card">
              <div className="app-header">
                <h3>{app.studentId.name}</h3>
                <span className={`status-badge ${app.status.toLowerCase()}`}>
                  {app.status}
                </span>
              </div>
              <p><strong>Email:</strong> {app.studentId.email}</p>
              <p><strong>Phone:</strong> {app.studentId.phone}</p>
              <p><strong>Hostel:</strong> {app.hostelId.name}</p>
              <p><strong>Address:</strong> {app.hostelId.address}</p>
              <p className="app-date">
                Applied: {new Date(app.createdAt).toLocaleDateString()}
              </p>
              <div className="action-buttons">
                <button 
                  className="view-btn"
                  onClick={() => handleViewDetails(app._id)}
                >
                  <FaEye /> View Details
                </button>
                {app.status === 'Pending' && (
                  <>
                    <button 
                      className="accept-btn"
                      onClick={() => handleStatusUpdate(app._id, 'Accepted')}
                    >
                      Accept
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleStatusUpdate(app._id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(app._id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusUpdate={handleStatusUpdate}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedApplication(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminApplications;
