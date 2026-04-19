import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { FaHome, FaTasks, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHostels: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [hostelsRes, applicationsRes] = await Promise.all([
        fetch(`${API_URL}/api/hostels/admin/my-hostels`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/applications/admin/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const hostels = await hostelsRes.json();
      const applications = await applicationsRes.json();

      setStats({
        totalHostels: hostels.length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(a => a.status === 'Pending').length,
        acceptedApplications: applications.filter(a => a.status === 'Accepted').length,
        rejectedApplications: applications.filter(a => a.status === 'Rejected').length
      });

      setRecentApplications(applications.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening with your hostels.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <FaHome />
            </div>
            <div className="stat-details">
              <h3>{stats.totalHostels}</h3>
              <p>Total Hostels</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <FaTasks />
            </div>
            <div className="stat-details">
              <h3>{stats.totalApplications}</h3>
              <p>Total Applications</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-details">
              <h3>{stats.pendingApplications}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-details">
              <h3>{stats.acceptedApplications}</h3>
              <p>Accepted</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <FaTimesCircle />
            </div>
            <div className="stat-details">
              <h3>{stats.rejectedApplications}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <button className="action-btn btn-primary" onClick={() => navigate('/admin/add-hostel')}>
            Add New Hostel
          </button>
          <button className="action-btn btn-secondary" onClick={() => navigate('/admin/my-hostels')}>
            View My Hostels
          </button>
          <button className="action-btn btn-secondary" onClick={() => navigate('/admin/applications')}>
            View All Applications
          </button>
        </div>

        <div className="recent-applications">
          <h2>Recent Applications</h2>
          {recentApplications.length === 0 ? (
            <p className="no-data">No applications yet</p>
          ) : (
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Hostel</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app._id}>
                      <td>{app.studentId?.name}</td>
                      <td>{app.hostelId?.name}</td>
                      <td>
                        <span className={`status-badge status-${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
