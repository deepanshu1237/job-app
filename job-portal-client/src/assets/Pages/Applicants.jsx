import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Swal from 'sweetalert2';

const Applicants = () => {
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const companyEmail = localStorage.getItem('companyEmail');
  
  useEffect(() => {
    if (!companyEmail) {
      Swal.fire({ icon: 'error', title: 'Unauthorized', text: 'Companies only' });
      navigate('/login/company', { replace: true });
      return;
    }
    
    setIsLoading(true);
    fetch(`http://localhost:3000/applicants/${companyEmail}`)
      .then(res => res.json())
      .then(data => {
        setApplicants(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applicants:', err);
        setIsLoading(false);
      });
  }, [companyEmail, navigate]);
  
  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/application/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setApplicants(applicants.map(app =>
          app._id === appId ? { ...app, status: newStatus } : app
        ));
        Swal.fire({ icon: 'success', title: `Status updated to ${newStatus}`, timer: 2000 });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return { bg: 'bg-green-50', badge: 'bg-green-200 text-green-700' };
      case 'rejected': return { bg: 'bg-red-50', badge: 'bg-red-200 text-red-700' };
      case 'interviewed': return { bg: 'bg-blue-50', badge: 'bg-blue-200 text-blue-700' };
      default: return { bg: 'bg-yellow-50', badge: 'bg-yellow-200 text-yellow-700' };
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'interviewed': return '🎯';
      default: return '⏳';
    }
  };

  return (
    <div className="max-w-screen-2xl container mx-auto xl:px-24 px-4 bg-gray-50 min-h-screen">
      <PageHeader title="Job Applicants" path="Applicants" />
      
      <div className="py-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Applicants Yet</h3>
            <p className="text-gray-500">When job seekers apply, they will appear here.</p>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Job Applicants</h2>
              <p className="text-gray-600 mt-2">Total: <span className="font-bold text-blue">{applicants.length}</span> applicants</p>
            </div>
            
            <div className="space-y-4">
              {applicants.map((app) => {
                const colors = getStatusColor(app.status);
                return (
                  <div key={app._id} className={`${colors.bg} border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition duration-300`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{app.jobTitle}</h3>
                        <p className="text-gray-600 flex items-center gap-2 mt-2">
                          <span>📧</span>
                          {app.userEmail}
                        </p>
                        <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                          <span>📅</span>
                          Applied: {new Date(app.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${colors.badge}`}>
                        {getStatusIcon(app.status)} {app.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-300">
                      <button onClick={() => handleStatusChange(app._id, 'interviewed')} 
                        className="px-4 py-2 bg-blue text-white rounded-lg font-semibold hover:opacity-90 transition">
                        🎯 Interview
                      </button>
                      <button onClick={() => handleStatusChange(app._id, 'accepted')} 
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:opacity-90 transition">
                        ✅ Accept
                      </button>
                      <button onClick={() => handleStatusChange(app._id, 'rejected')} 
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applicants;
