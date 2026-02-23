import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    about: '',
    profileImage: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ applied: 0, saved: 0, interviews: 0 });

  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!email) {
      navigate('/login/seeker', { replace: true });
    }
  }, [navigate, email]);

  useEffect(() => {
    if (email) {
      fetchProfile();
      fetchStats();
    }
  }, [email]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:3000/user-profile/${email}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`http://localhost:3000/stats/seeker/${email}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`http://localhost:3000/user-profile/${email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        Swal.fire({ icon: 'success', title: 'Profile Updated', timer: 2000 });
      } else {
        Swal.fire({ icon: 'error', title: 'Update Failed', text: data.error });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Network error' });
    }
  };

  return (
    <div className='max-w-screen-2xl container mx-auto xl:px-24 px-4 py-10'>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue to-blue/80 p-8 text-white">
              <h1 className="text-3xl font-bold">👤 My Profile</h1>
              <p className="text-blue-100 mt-2">Manage your career information</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {!isEditing ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Name</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.name || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Email</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.email || email}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Mobile</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.mobile || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Profile Image</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.profileImage ? '✓ Uploaded' : 'No image'}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-600 font-semibold">About</label>
                    <p className="text-gray-800 mt-2">{profile.about || 'No bio provided'}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className='bg-blue text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition'
                  >
                    ✎ Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
                      <input
                        type="text"
                        name="mobile"
                        value={profile.mobile}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image URL</label>
                      <input
                        type="url"
                        name="profileImage"
                        value={profile.profileImage}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">About You</label>
                      <textarea
                        name="about"
                        value={profile.about}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself, skills, experience..."
                        rows={5}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      className='bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition'
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className='bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition'
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Your Stats</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue">
                <p className="text-gray-600 text-sm">Applications Sent</p>
                <p className="text-3xl font-bold text-blue">{stats.appliedCount || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-gray-600 text-sm">Accepted</p>
                <p className="text-3xl font-bold text-green-600">{stats.acceptedCount || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
                <p className="text-gray-600 text-sm">Saved Jobs</p>
                <p className="text-3xl font-bold text-purple-600">{stats.savedCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔗 Quick Links</h3>
            <div className="space-y-2">
              <a href="/applications" className="block px-4 py-2 bg-blue text-white rounded-lg hover:opacity-90 transition text-center">
                My Applications
              </a>
              <a href="/saved-jobs" className="block px-4 py-2 bg-purple-600 text-white rounded-lg hover:opacity-90 transition text-center">
                Saved Jobs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
