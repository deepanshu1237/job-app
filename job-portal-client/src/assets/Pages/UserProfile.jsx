import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiUrl } from '../../utils/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    about: '',
    profileImage: '',
    skills: [],
    experienceYears: 0,
    proofLinks: [],
    certificates: [],
    tenthPercentage: '',
    twelfthPercentage: '',
    cgpa: '',
    degree: '',
    branch: '',
    college: '',
    passoutYear: '',
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
      const res = await fetch(apiUrl(`/user-profile/${email}`), {
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
      const res = await fetch(apiUrl(`/stats/seeker/${email}`));
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

  const handleSkillsInput = (e) => {
    const raw = e.target.value || '';
    const skills = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 50);
    setProfile(prev => ({ ...prev, skills }));
  };

  const handleSaveProfile = async () => {
    try {
      const tenth = profile.tenthPercentage === '' || profile.tenthPercentage === null ? null : Number(profile.tenthPercentage);
      const twelfth = profile.twelfthPercentage === '' || profile.twelfthPercentage === null ? null : Number(profile.twelfthPercentage);
      const cgpa = profile.cgpa === '' || profile.cgpa === null ? null : Number(profile.cgpa);
      const year = profile.passoutYear === '' || profile.passoutYear === null ? null : Number(profile.passoutYear);
      const exp = profile.experienceYears === '' || profile.experienceYears === null ? 0 : Number(profile.experienceYears);
      const currentYear = new Date().getFullYear();

      if ((tenth !== null && (tenth < 0 || tenth > 100)) || (twelfth !== null && (twelfth < 0 || twelfth > 100))) {
        Swal.fire({ icon: 'error', title: 'Invalid marks', text: '10th and 12th percentages must be between 0 and 100.' });
        return;
      }
      if (cgpa !== null && (cgpa < 0 || cgpa > 10)) {
        Swal.fire({ icon: 'error', title: 'Invalid CGPA', text: 'CGPA must be between 0 and 10.' });
        return;
      }
      if (year !== null && (year < 1990 || year > currentYear + 10)) {
        Swal.fire({ icon: 'error', title: 'Invalid passout year', text: `Passout year must be between 1990 and ${currentYear + 10}.` });
        return;
      }
      if (!Number.isFinite(exp) || exp < 0 || exp > 50) {
        Swal.fire({ icon: 'error', title: 'Invalid experience', text: 'Experience must be between 0 and 50 years.' });
        return;
      }

      const res = await fetch(apiUrl(`/user-profile/${email}`), {
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

  const handleArrayInput = (field, value) => {
    const items = String(value || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 30);
    setProfile((prev) => ({ ...prev, [field]: items }));
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">10th Percentage</label>
                      <p className="text-gray-800 mt-2">{profile.tenthPercentage ?? 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">12th Percentage</label>
                      <p className="text-gray-800 mt-2">{profile.twelfthPercentage ?? 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">CGPA</label>
                      <p className="text-gray-800 mt-2">{profile.cgpa ?? 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Passout Year</label>
                      <p className="text-gray-800 mt-2">{profile.passoutYear ?? 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Degree</label>
                      <p className="text-gray-800 mt-2">{profile.degree || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Branch</label>
                      <p className="text-gray-800 mt-2">{profile.branch || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-600 font-semibold">College</label>
                    <p className="text-gray-800 mt-2">{profile.college || 'Not provided'}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Proof Links</label>
                      <p className="text-gray-800 mt-2">
                        {Array.isArray(profile.proofLinks) && profile.proofLinks.length > 0 ? profile.proofLinks.join(', ') : 'Not provided'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Certificates</label>
                      <p className="text-gray-800 mt-2">
                        {Array.isArray(profile.certificates) && profile.certificates.length > 0 ? profile.certificates.join(', ') : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-600 font-semibold">About</label>
                    <p className="text-gray-800 mt-2">{profile.about || 'No bio provided'}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Experience (years)</label>
                      <p className="text-lg text-gray-800 font-semibold mt-2">{profile.experienceYears ?? 0}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 font-semibold">Skills</label>
                      <p className="text-gray-800 mt-2">
                        {Array.isArray(profile.skills) && profile.skills.length > 0 ? profile.skills.join(', ') : 'Not provided'}
                      </p>
                    </div>
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
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Experience (years)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          name="experienceYears"
                          value={profile.experienceYears ?? 0}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Skills (comma separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(profile.skills) ? profile.skills.join(', ') : ''}
                          onChange={handleSkillsInput}
                          placeholder="e.g. React, Node.js, MongoDB"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">10th Percentage</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          name="tenthPercentage"
                          value={profile.tenthPercentage ?? ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">12th Percentage</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          name="twelfthPercentage"
                          value={profile.twelfthPercentage ?? ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">CGPA</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          name="cgpa"
                          value={profile.cgpa ?? ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Passout Year</label>
                        <input
                          type="number"
                          min="1990"
                          max="2100"
                          name="passoutYear"
                          value={profile.passoutYear ?? ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Degree</label>
                        <input
                          type="text"
                          name="degree"
                          value={profile.degree || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                        <input
                          type="text"
                          name="branch"
                          value={profile.branch || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">College</label>
                      <input
                        type="text"
                        name="college"
                        value={profile.college || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Proof Links (comma separated URLs)</label>
                        <input
                          type="text"
                          value={Array.isArray(profile.proofLinks) ? profile.proofLinks.join(', ') : ''}
                          onChange={(e) => handleArrayInput('proofLinks', e.target.value)}
                          placeholder="https://github.com/... , https://project-demo.com/..."
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Certificates (comma separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(profile.certificates) ? profile.certificates.join(', ') : ''}
                          onChange={(e) => handleArrayInput('certificates', e.target.value)}
                          placeholder="AWS CCP, Meta React, ..."
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
                        />
                      </div>
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
