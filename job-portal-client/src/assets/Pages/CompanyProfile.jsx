import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiUrl } from '../../utils/api';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    companyName: '',
    email: '',
    website: '',
    about: '',
    location: '',
    logo: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ jobsPosted: 0, totalApplications: 0, accepted: 0, interviewed: 0 });

  const email = localStorage.getItem('companyEmail');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!email) {
      navigate('/login/company', { replace: true });
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
      const res = await fetch(apiUrl(`/company-profile/${email}`), {
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
      const res = await fetch(apiUrl(`/stats/company/${email}`));
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
      const res = await fetch(apiUrl(`/company-profile/${email}`), {
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
              <h1 className="text-3xl font-bold">🏢 Company Profile</h1>
              <p className="text-blue-100 mt-2">Manage your company information</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {!isEditing ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Your Name</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.name || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Company Name</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.companyName || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Email</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.email || email}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Location</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.location || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                      <label className="text-sm text-gray-600 font-semibold">Website</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.website || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-600 font-semibold">Company Logo</label>
                    <p className="text-lg text-gray-800 font-semibold mt-2">{profile.logo ? '✓ Uploaded' : 'No logo'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-600 font-semibold">About</label>
                    <p className="text-gray-800 mt-2">{profile.about || 'No description provided'}</p>
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        value={profile.companyName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={profile.location}
                        onChange={handleInputChange}
                        placeholder="City, State"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={profile.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo URL</label>
                      <input
                        type="url"
                        name="logo"
                        value={profile.logo}
                        onChange={handleInputChange}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company Description</label>
                      <textarea
                        name="about"
                        value={profile.about}
                        onChange={handleInputChange}
                        placeholder="Tell us about your company, mission, values..."
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Hiring Stats</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue">
                <p className="text-gray-600 text-sm">Jobs Posted</p>
                <p className="text-3xl font-bold text-blue">{stats.jobsPosted || 0}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-600">
                <p className="text-gray-600 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalApplications || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="text-gray-600 text-sm">Interviewed</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.interviewed || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-gray-600 text-sm">Accepted</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔗 Quick Links</h3>
            <div className="space-y-2">
              <a href="/post-job" className="block px-4 py-2 bg-blue text-white rounded-lg hover:opacity-90 transition text-center">
                Post a Job
              </a>
              <a href="/applicants" className="block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:opacity-90 transition text-center">
                View Applicants
              </a>
              <a href="/my-job" className="block px-4 py-2 bg-purple-600 text-white rounded-lg hover:opacity-90 transition text-center">
                My Jobs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
