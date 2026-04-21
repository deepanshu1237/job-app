import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiUrl } from '../../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    acceptedApplications: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportedJobs, setReportedJobs] = useState([]);

  useEffect(() => {
    // Check if user is admin (for simplicity, we'll check if email contains 'admin')
    const email = localStorage.getItem('companyEmail') || localStorage.getItem('userEmail');
    if (!email || !email.includes('admin')) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Admin access only'
      }).then(() => navigate('/', { replace: true }));
    } else {
      setIsAdmin(true);
      fetchStats();
      fetchReports();
    }
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const res = await fetch(apiUrl('/admin-stats'));
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/admin/reported-jobs'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setReportedJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  if (!isAdmin) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className='max-w-screen-2xl container mx-auto xl:px-24 px-4 py-10'>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">🔐 Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Total Users</p>
              <p className="text-3xl font-bold text-blue mt-2">{stats.totalUsers}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        {/* Total Companies */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Companies</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalCompanies}</p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
        </div>

        {/* Total Jobs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Jobs Posted</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalJobs}</p>
            </div>
            <div className="text-4xl">💼</div>
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Applications</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalApplications}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        {/* Accepted Applications */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Accepted</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.acceptedApplications}</p>
            </div>
            <div className="text-4xl">✓</div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Activity Overview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Platform Growth</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="font-semibold text-gray-700">Users Registered</span>
              <span className="text-2xl font-bold text-blue">{stats.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
              <span className="font-semibold text-gray-700">Companies Registered</span>
              <span className="text-2xl font-bold text-indigo-600">{stats.totalCompanies}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="font-semibold text-gray-700">Total Jobs</span>
              <span className="text-2xl font-bold text-purple-600">{stats.totalJobs}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <span className="font-semibold text-gray-700">Active Applications</span>
              <span className="text-2xl font-bold text-orange-600">{stats.totalApplications}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🏥 System Health</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.totalApplications > 0 ? ((stats.acceptedApplications / stats.totalApplications) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Avg Applications per Job</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.totalJobs > 0 ? (stats.totalApplications / stats.totalJobs).toFixed(1) : 0}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue">
              <p className="text-sm text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold text-blue mt-1">
                {stats.totalApplications - stats.acceptedApplications}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-bold text-green-600 mt-1">✓ All Systems Operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">⚙️ Admin Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-4 bg-gradient-to-r from-blue to-blue/80 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            👥 Manage Users
          </button>
          <button
            onClick={() => navigate('/admin/companies')}
            className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            🏢 Manage Companies
          </button>
          <button
            onClick={() => navigate('/admin/jobs')}
            className="p-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            💼 Manage Jobs
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🚨 Scam Shield Reports</h3>
        {reportedJobs.length === 0 ? (
          <p className="text-gray-600">No job reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reportedJobs.slice(0, 10).map((r) => (
              <div key={r._id} className="p-4 border rounded-lg bg-red-50">
                <p className="font-semibold text-gray-800">{r.job?.jobTitle || 'Unknown job'}</p>
                <p className="text-sm text-gray-700">Reporter: {r.reporterEmail}</p>
                <p className="text-sm text-gray-700">Reason: {r.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-gray-600 text-sm">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
