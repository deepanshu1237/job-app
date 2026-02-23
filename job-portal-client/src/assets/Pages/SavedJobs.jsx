import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Swal from 'sweetalert2';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const userEmail = localStorage.getItem('userEmail');
  
  useEffect(() => {
    if (!userEmail) {
      navigate('/login/seeker', { replace: true });
      return;
    }
    
    setIsLoading(true);
    fetch(`http://localhost:3000/saved-jobs/${userEmail}`)
      .then(res => res.json())
      .then(data => {
        setSavedJobs(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching saved jobs:', err);
        setIsLoading(false);
      });
  }, [userEmail, navigate]);
  
  const handleRemove = async (jobId) => {
    try {
      const res = await fetch(`http://localhost:3000/saved-job/${jobId}/${userEmail}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedJobs(savedJobs.filter(job => job.jobId !== jobId));
        Swal.fire({ icon: 'success', title: 'Removed from saved jobs', timer: 2000 });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  return (
    <div className="max-w-screen-2xl container mx-auto xl:px-24 px-4 bg-gray-50 min-h-screen">
      <PageHeader title="Saved Jobs" path="Saved Jobs" />
      
      <div className="py-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💾</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Saved Jobs</h3>
            <p className="text-gray-500">Save jobs for later by clicking the heart icon on job listings!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Saved Jobs</h2>
              <p className="text-gray-600 mt-2">Total: <span className="font-bold text-blue">{savedJobs.length}</span> jobs saved</p>
            </div>
            
            {savedJobs.map((job) => (
              <div key={job._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition duration-300 transformhover:scale-105 origin-left">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <Link to={`/job/${job.jobId}`} className="text-2xl font-bold text-blue hover:text-blue-dark transition">
                      {job.jobTitle}
                    </Link>
                    <p className="text-gray-600 flex items-center gap-2 mt-2">
                      <span>🏢</span>
                      {job.companyName}
                    </p>
                    <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                      <span>📌</span>
                      Saved {new Date(job.savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link to={`/job/${job.jobId}`} className="px-6 py-2 bg-blue text-white rounded-lg font-semibold hover:bg-blue-dark transition text-center">
                      View Job
                    </Link>
                    <button onClick={() => handleRemove(job.jobId)} className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
