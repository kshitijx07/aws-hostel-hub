import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { FaTrash } from 'react-icons/fa';
import './EditHostel.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const EditHostel = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    price: '',
    capacity: '',
    amenities: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  useEffect(() => {
    fetchHostel();
  }, []);

  const fetchHostel = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hostels/${id}`);
      const data = await response.json();
      
      setFormData({
        name: data.name,
        address: data.address,
        description: data.description,
        price: data.price,
        capacity: data.capacity,
        amenities: data.amenities.join(', ')
      });
      setExistingImages(data.images || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hostel:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages([...newImages, ...files]);

    const previews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...previews]);
  };

  const removeNewImage = (index) => {
    const updatedImages = newImages.filter((_, i) => i !== index);
    const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);
    setNewImages(updatedImages);
    setNewImagePreviews(updatedPreviews);
  };

  const removeExistingImage = async (publicId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`${API_URL}/api/hostels/${id}/image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ publicId })
      });

      if (response.ok) {
        setExistingImages(existingImages.filter(img => img.publicId !== publicId));
        alert('Image deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('address', formData.address);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('capacity', formData.capacity);
    data.append('amenities', JSON.stringify(formData.amenities.split(',').map(a => a.trim())));

    newImages.forEach(image => {
      data.append('images', image);
    });

    try {
      const response = await fetch(`${API_URL}/api/hostels/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (response.ok) {
        alert('Hostel updated successfully!');
        navigate('/admin/my-hostels');
      } else {
        alert('Failed to update hostel');
      }
    } catch (error) {
      console.error('Error updating hostel:', error);
      alert('Error updating hostel');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading hostel...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="edit-hostel">
        <div className="page-header">
          <h1>Edit Hostel</h1>
          <p>Update your hostel information</p>
        </div>

        <form onSubmit={handleSubmit} className="hostel-form">
          <div className="form-group">
            <label>Hostel Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (per month) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Amenities (comma separated)</label>
            <input
              type="text"
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              placeholder="WiFi, AC, Mess, Laundry"
            />
          </div>

          <div className="form-group">
            <label>Existing Images</label>
            <div className="images-grid">
              {existingImages.map((image, index) => (
                <div key={index} className="image-preview">
                  <img src={image.url} alt={`Hostel ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeExistingImage(image.publicId)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Add New Images (Max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <div className="images-grid">
              {newImagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeNewImage(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              Update Hostel
            </button>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/admin/my-hostels')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditHostel;
