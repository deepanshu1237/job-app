import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const userEmail = localStorage.getItem('userEmail');
  
  useEffect(() => {
    if (!userEmail) {
      navigate('/login/seeker', { replace: true });
      return;
    }
    
    setIsLoading(true);
    fetch(`http://localhost:3000/my-applications/${userEmail}`)
      .then(res => res.json())
      .then(data => {
        setApplications(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applications:', err);
        setIsLoading(false);
      });
  }, [userEmail, navigate]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-200' };
      case 'rejected': return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-200' };
      case 'interviewed': return { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-200' };
      default: return { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-200' };
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
      <PageHeader title="My Applications" path="Applications" />
      
      <div className="py-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Applications Yet</h3>
            <p className="text-gray-500">Start applying to jobs to track your progress here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Your Applications</h2>
              <p className="text-gray-600 mt-2">Total: <span className="font-bold text-blue">{applications.length}</span> applications</p>
            </div>
            
            {applications.map((app) => {
              const colors = getStatusColor(app.status);
              return (
                <div key={app._id} className={`${colors.bg} border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition duration-300`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{app.jobTitle}</h3>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span>🏢</span>
                        {app.companyName}
                      </p>
                      <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                        <span>📅</span>
                        Applied on {new Date(app.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className={`inline-block px-4 py-2 rounded-full font-bold ${colors.badge} ${colors.text}`}>
                        {getStatusIcon(app.status)} {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
