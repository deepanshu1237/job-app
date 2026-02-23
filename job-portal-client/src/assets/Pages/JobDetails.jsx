import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import PageHeader from '../../components/PageHeader'
import CompanyReviews from '../../components/CompanyReviews'
import axios from 'axios';

const JobDetails = () => {
    const {id} = useParams();
    const [job, setJob] = useState([])
    const [isSaved, setIsSaved] = useState(false);
    
    useEffect(() => {
      fetch(`http://localhost:3000/all-jobs/${id}`).then(res => res.json()).then(data => setJob(data))
      checkIfSaved();
    }, [id])
    
    const checkIfSaved = async () => {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        try {
          const res = await fetch(`http://localhost:3000/saved-jobs/${userEmail}`);
          const saved = await res.json();
          const found = saved.some(s => s.jobId === id);
          setIsSaved(found);
        } catch (err) {
          console.error('Error checking saved jobs:', err);
        }
      }
    };

    const handleApply = async() => {
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');
        const companyEmail = localStorage.getItem('companyEmail');
        
        if (!userEmail && !companyEmail) {
            Swal.fire({ icon: 'error', title: 'Not logged in', text: 'Please login to apply' });
            return;
        }
        
        if (companyEmail) {
            Swal.fire({ icon: 'error', title: 'Invalid', text: 'Companies cannot apply for jobs' });
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ jobId: id })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to apply');
            
            Swal.fire({ icon: 'success', title: 'Applied!', text: 'Your application has been submitted' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        }
    }
    
    const handleSaveJob = async () => {
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');
        
        if (!userEmail) {
            Swal.fire({ icon: 'error', title: 'Not logged in', text: 'Please login to save jobs' });
            return;
        }

        try {
            if (isSaved) {
                const res = await fetch(`http://localhost:3000/saved-job/${id}/${userEmail}`, { method: 'DELETE' });
                if (res.ok) {
                    setIsSaved(false);
                    Swal.fire({ icon: 'success', title: 'Removed from saved jobs', timer: 2000 });
                }
            } else {
                const res = await fetch('http://localhost:3000/save-job', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ jobId: id })
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to save');
                
                setIsSaved(true);
                Swal.fire({ icon: 'success', title: 'Saved!', text: 'Job added to your saved jobs', timer: 2000 });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        }
    }

  return (
    <div className="max-w-screen-2xl container mx-auto xl:px-24 px-4 bg-gray-50  min-h-screen">
        <PageHeader title="Job Details" path="Job Details"/>
        <div className="py-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Job Details */}
            <div className="lg:col-span-2 bg-white  rounded-lg shadow-lg p-8 h-fit">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-800  mb-2">{job.jobTitle}</h1>
                <p className="text-xl text-gray-600  flex items-center gap-2">
                  <span>🏢</span>
                  {job.companyName}
                </p>
              </div>
              {job.companyLogo && (
                <img src={job.companyLogo} alt="Company Logo" className="w-20 h-20 rounded-lg" />
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50  p-4 rounded-lg">
                <p className="text-gray-600  text-sm mb-1">📍 Location</p>
                <p className="text-lg font-bold text-gray-800 ">{job.jobLocation}</p>
              </div>
              <div className="bg-green-50  p-4 rounded-lg">
                <p className="text-gray-600  text-sm mb-1">💰 Salary</p>
                <p className="text-lg font-bold text-gray-800 ">{job.minPrice} - {job.maxPrice}</p>
              </div>
              <div className="bg-purple-50  p-4 rounded-lg">
                <p className="text-gray-600  text-sm mb-1">👔 Type</p>
                <p className="text-lg font-bold text-gray-800 ">{job.employmentType}</p>
              </div>
              <div className="bg-orange-50  p-4 rounded-lg">
                <p className="text-gray-600  text-sm mb-1">📚 Experience</p>
                <p className="text-lg font-bold text-gray-800 ">{job.experienceLevel}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800  mb-4">Job Description</h3>
              <p className="text-gray-600  leading-relaxed text-lg">{job.description}</p>
            </div>
            
            {job.skills && job.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800  mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, i) => (
                    <span key={i} className="bg-blue-100  text-blue  px-4 py-2 rounded-full font-semibold">
                      {skill.label || skill.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-4 pt-8 border-t border-gray-300 ">
              <button className="flex-1 px-8 py-4 bg-blue text-white rounded-lg font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2" onClick={handleApply}>
                📤 Apply Now
              </button>
              <button className={`px-8 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${isSaved ? 'bg-red-500 text-white hover:opacity-90' : 'bg-gray-200  text-gray-800  hover:bg-gray-300 '}`} onClick={handleSaveJob}>
                {isSaved ? '❤️ Saved' : '🤍 Save Job'}
              </button>
            </div>
            </div>

            {/* Reviews Sidebar */}
            <div className="lg:col-span-1">
              <CompanyReviews companyEmail={job.postedBy} />
            </div>
          </div>
        </div>
    </div>
  )
}

export default JobDetails

