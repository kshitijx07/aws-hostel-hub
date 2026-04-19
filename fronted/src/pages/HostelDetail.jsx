import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaRupeeSign, FaUsers, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { getHostelById, createApplication } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './HostelDetail.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const HostelDetail = () => {
  const [hostel, setHostel] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    college: '',
    course: '',
    year: '',
    currentAddress: '',
    permanentAddress: '',
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    preferredRoomType: '',
    moveInDate: '',
    duration: '',
    specialRequirements: '',
    hasAllergies: false,
    allergiesDetails: '',
    hasMedicalConditions: false,
    medicalConditionsDetails: ''
  });

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    const hostelData = await getHostelById(id);
    setHostel(hostelData);
    
    // Check if student has already applied
    if (user && user.role === 'student') {
      try {
        const response = await fetch(`${API_URL}/api/applications/student/my-applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const applications = await response.json();
        const existingApp = applications.find(app => app.hostelId._id === id);
        setExistingApplication(existingApp || null);
      } catch (error) {
        console.error('Error checking application:', error);
      }
    }
  };

  const handleShowForm = () => {
    if (!user) {
      navigate('/student/login');
      return;
    }
    setShowApplicationForm(true);
    // Scroll to form
    setTimeout(() => {
      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const applicationData = {
      hostelId: id,
      ...formData,
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relation: formData.emergencyContactRelation
      }
    };

    const result = await createApplication(applicationData);
    setLoading(false);

    if (result._id) {
      setMessage('Application submitted successfully!');
      setShowApplicationForm(false);
      // Reset form data
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        college: '',
        course: '',
        year: '',
        currentAddress: '',
        permanentAddress: '',
        fatherName: '',
        fatherPhone: '',
        fatherOccupation: '',
        motherName: '',
        motherPhone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        preferredRoomType: '',
        moveInDate: '',
        duration: '',
        specialRequirements: '',
        hasAllergies: false,
        allergiesDetails: '',
        hasMedicalConditions: false,
        medicalConditionsDetails: ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setMessage(result.message || 'Failed to submit application');
    }
  };

  if (!hostel) return <div className="loading">Loading...</div>;

  return (
    <div className="hostel-detail-container">
      <div className="hostel-detail-layout">
        {/* Left Side - Details */}
        <div className="hostel-detail-content">
          <h2>{hostel.name}</h2>
          <p className="detail-address">
            <FaMapMarkerAlt /> {hostel.address}
          </p>

          <div className="price-capacity-row">
            <div className="info-box">
              <div className="info-label">Price per Month</div>
              <div className="info-value price">
                <FaRupeeSign /> {hostel.price}
              </div>
            </div>
            <div className="info-box">
              <div className="info-label">Capacity</div>
              <div className="info-value capacity">
                <FaUsers /> {hostel.capacity}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>About this Hostel</h3>
            <p>{hostel.description}</p>
          </div>

          {hostel.amenities && hostel.amenities.length > 0 && (
            <div className="detail-section">
              <h3>Amenities & Facilities</h3>
              <ul className="amenities-list">
                {hostel.amenities.map((amenity, index) => (
                  <li key={index}>{amenity}</li>
                ))}
              </ul>
            </div>
          )}

          {message && <div className="message success-message"><FaCheckCircle /> {message}</div>}
          
          {/* Application Status and Actions */}
          {user && user.role === 'student' && (
            <>
              {existingApplication ? (
                <div className="application-status-section">
                  <div className={`status-alert status-${existingApplication.status.toLowerCase()}`}>
                    <div className="status-header">
                      {existingApplication.status === 'Pending' && <><FaCheckCircle /> Application Submitted</>}
                      {existingApplication.status === 'Accepted' && <><FaCheckCircle /> Application Accepted!</>}
                      {existingApplication.status === 'Rejected' && <><FaTimes /> Application Rejected</>}
                    </div>
                    <p className="status-message">
                      {existingApplication.status === 'Pending' && 'Your application is under review. You will be notified once the hostel owner responds.'}
                      {existingApplication.status === 'Accepted' && 'Congratulations! Your application has been accepted. Contact the hostel owner for next steps.'}
                      {existingApplication.status === 'Rejected' && 'Unfortunately, your application was not accepted. You can apply to other hostels.'}
                    </p>
                    <p className="status-date">
                      Applied on: {new Date(existingApplication.createdAt).toLocaleDateString()}
                    </p>
                    
                    {existingApplication.status === 'Accepted' && hostel.adminId && (
                      <div className="owner-contact-section">
                        <h4>Owner Contact Details</h4>
                        <div className="contact-info">
                          <p><strong>Name:</strong> {hostel.adminId.name}</p>
                          <p><strong>Email:</strong> <a href={`mailto:${hostel.adminId.email}`}>{hostel.adminId.email}</a></p>
                          <p><strong>Next Steps:</strong> Please contact the owner to discuss payment, move-in date, and other details.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                !showApplicationForm && (
                  <button className="apply-button" onClick={handleShowForm}>
                    Apply for this Hostel
                  </button>
                )
              )}
            </>
          )}
        </div>

        {/* Right Side - Images */}
        <div className="hostel-images-section">
          {hostel.images && hostel.images.length > 0 ? (
            <>
              <div className="main-image-container">
                <img 
                  src={hostel.images[selectedImage].url} 
                  alt={hostel.name}
                  className="main-image"
                />
              </div>
              {hostel.images.length > 1 && (
                <div className="image-gallery">
                  {hostel.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`${hostel.name} ${index + 1}`}
                      className={`gallery-thumb ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-images">🏠</div>
          )}
        </div>
      </div>

      {/* Application Form */}
      {showApplicationForm && (
        <div className="application-form-section" id="application-form">
          <div className="form-header">
            <h2>Hostel Application Form</h2>
            <button className="close-form-btn" onClick={() => setShowApplicationForm(false)}>
              <FaTimes />
            </button>
          </div>
          <p className="form-subtitle">Please fill in all the required details to complete your application</p>

          <form onSubmit={handleSubmit} className="application-form">
            {/* Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Educational Information */}
            <div className="form-section">
              <h3>Educational Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>College/University *</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Course/Program *</label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="e.g., B.Tech, MBA"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Year of Study *</label>
                  <select name="year" value={formData.year} onChange={handleChange} required>
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <h3>Address Information</h3>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>Current Address *</label>
                  <textarea
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    rows="2"
                    required
                  />
                </div>
                <div className="form-field full-width">
                  <label>Permanent Address *</label>
                  <textarea
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    rows="2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div className="form-section">
              <h3>Parent/Guardian Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Father's Name *</label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Father's Phone *</label>
                  <input
                    type="tel"
                    name="fatherPhone"
                    value={formData.fatherPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Father's Occupation *</label>
                  <input
                    type="text"
                    name="fatherOccupation"
                    value={formData.fatherOccupation}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Mother's Name *</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Mother's Phone *</label>
                  <input
                    type="tel"
                    name="motherPhone"
                    value={formData.motherPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="form-section">
              <h3>Emergency Contact</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Contact Phone *</label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Relation *</label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleChange}
                    placeholder="e.g., Uncle, Aunt, Friend"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Accommodation Preferences */}
            <div className="form-section">
              <h3>Accommodation Preferences</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Preferred Room Type *</label>
                  <select name="preferredRoomType" value={formData.preferredRoomType} onChange={handleChange} required>
                    <option value="">Select Room Type</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Expected Move-in Date *</label>
                  <input
                    type="date"
                    name="moveInDate"
                    value={formData.moveInDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Duration of Stay *</label>
                  <select name="duration" value={formData.duration} onChange={handleChange} required>
                    <option value="">Select Duration</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="More than 2 Years">More than 2 Years</option>
                  </select>
                </div>
                <div className="form-field full-width">
                  <label>Special Requirements (Optional)</label>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Any special requirements or preferences..."
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="form-section">
              <h3>Medical Information</h3>
              <div className="form-grid">
                <div className="form-field checkbox-field">
                  <label>
                    <input
                      type="checkbox"
                      name="hasAllergies"
                      checked={formData.hasAllergies}
                      onChange={handleChange}
                    />
                    <span>I have allergies</span>
                  </label>
                </div>
                {formData.hasAllergies && (
                  <div className="form-field full-width">
                    <label>Please specify allergies *</label>
                    <textarea
                      name="allergiesDetails"
                      value={formData.allergiesDetails}
                      onChange={handleChange}
                      rows="2"
                      required={formData.hasAllergies}
                    />
                  </div>
                )}
                <div className="form-field checkbox-field">
                  <label>
                    <input
                      type="checkbox"
                      name="hasMedicalConditions"
                      checked={formData.hasMedicalConditions}
                      onChange={handleChange}
                    />
                    <span>I have medical conditions</span>
                  </label>
                </div>
                {formData.hasMedicalConditions && (
                  <div className="form-field full-width">
                    <label>Please specify medical conditions *</label>
                    <textarea
                      name="medicalConditionsDetails"
                      value={formData.medicalConditionsDetails}
                      onChange={handleChange}
                      rows="2"
                      required={formData.hasMedicalConditions}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowApplicationForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HostelDetail;
