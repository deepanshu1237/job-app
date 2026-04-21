import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import PageHeader from '../../components/PageHeader'
import CompanyReviews from '../../components/CompanyReviews'
import axios from 'axios';
import { computeEligibility } from '../../utils/eligibility';
import { apiUrl } from '../../utils/api';

const JobDetails = () => {
    const {id} = useParams();
    const [job, setJob] = useState([])
    const [isSaved, setIsSaved] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [seekerProfile, setSeekerProfile] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [referralMessage, setReferralMessage] = useState('');
    
    useEffect(() => {
      fetch(apiUrl(`/all-jobs/${id}`)).then(res => res.json()).then(data => setJob(data))
      checkIfSaved();
    }, [id])

    useEffect(() => {
      const userEmail = localStorage.getItem('userEmail');
      const token = localStorage.getItem('token');
      if (!userEmail || !token) {
        setSeekerProfile(null);
        return;
      }
      fetch(apiUrl(`/user-profile/${userEmail}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSeekerProfile(data))
        .catch(() => setSeekerProfile(null));
    }, [id]);
    
    const checkIfSaved = async () => {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        try {
          const res = await fetch(apiUrl(`/saved-jobs/${userEmail}`));
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
        
        if (!resumeFile) {
            Swal.fire({ icon: 'error', title: 'Resume required', text: 'Please upload your resume (PDF/DOC/DOCX) to apply.' });
            return;
        }

        try {
            const form = new FormData();
            form.append('jobId', id);
            form.append('resume', resumeFile);

            const res = await fetch(apiUrl('/apply'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to apply');
            
            Swal.fire({ icon: 'success', title: 'Applied!', text: 'Your application has been submitted' });
            setResumeFile(null);
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
                const res = await fetch(apiUrl(`/saved-job/${id}/${userEmail}`), { method: 'DELETE' });
                if (res.ok) {
                    setIsSaved(false);
                    Swal.fire({ icon: 'success', title: 'Removed from saved jobs', timer: 2000 });
                }
            } else {
                const res = await fetch(apiUrl('/save-job'), {
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

    const handleReportJob = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !localStorage.getItem('userEmail')) {
          Swal.fire({ icon: 'error', title: 'Login required', text: 'Please login as seeker to report jobs.' });
          return;
        }
        const res = await fetch(apiUrl(`/jobs/${id}/report`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ reason: reportReason || 'Suspicious content' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to report');
        Swal.fire({ icon: 'success', title: 'Reported', text: 'Admin will review this job.' });
        setReportReason('');
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.message });
      }
    };

    const handleReferralRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !localStorage.getItem('userEmail')) {
          Swal.fire({ icon: 'error', title: 'Login required', text: 'Please login as seeker.' });
          return;
        }
        const res = await fetch(apiUrl('/referrals/request'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ jobId: id, message: referralMessage }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to request referral');
        Swal.fire({ icon: 'success', title: 'Referral requested', text: 'Company can now respond in referral marketplace.' });
        setReferralMessage('');
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.message });
      }
    };

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

            {job?.scamShield && (
              <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Scam Shield</h3>
                <p className="text-gray-700">
                  Risk level: <span className="font-semibold uppercase">{job.scamShield.riskLevel}</span> | Score: <span className="font-semibold">{job.scamShield.scamScore}</span>/100
                </p>
                {Array.isArray(job.scamShield.riskReasons) && job.scamShield.riskReasons.length > 0 && (
                  <ul className="list-disc ml-5 mt-2 text-gray-700">
                    {job.scamShield.riskReasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
                {localStorage.getItem('userEmail') && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Report reason (optional)"
                    />
                    <button onClick={handleReportJob} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:opacity-90">
                      Report Job
                    </button>
                  </div>
                )}
              </div>
            )}

            {localStorage.getItem('userEmail') && (
              <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Eligibility</h3>
                {(() => {
                  const e = computeEligibility({ job, seekerProfile });
                  if (e.eligible === null) return <p className="text-gray-600">Complete your profile to see eligibility.</p>;
                  return (
                    <div>
                      {e.eligible ? (
                        <p className="font-semibold text-green-700">✅ You are eligible to apply.</p>
                      ) : (
                        <div>
                          <p className="font-semibold text-red-700">❌ You are not eligible yet.</p>
                          <ul className="mt-2 list-disc ml-5 text-gray-700">
                            {(e.reasons || []).map((r, idx) => <li key={idx}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                      {typeof e.skillMatchPercent === 'number' && (
                        <p className="text-sm text-gray-600 mt-2">Skill match: <span className="font-semibold">{e.skillMatchPercent}%</span></p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
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
            
            <div className="pt-8 border-t border-gray-300 ">
              {localStorage.getItem('userEmail') && (
                <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-2">Referral Marketplace</h4>
                  <div className="flex gap-2">
                    <input
                      value={referralMessage}
                      onChange={(e) => setReferralMessage(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Add a short intro to request referral..."
                    />
                    <button onClick={handleReferralRequest} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:opacity-90">
                      Request Referral
                    </button>
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Resume (PDF/DOC/DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg bg-white"
                />
                {resumeFile && (
                  <p className="text-sm text-gray-600 mt-2">Selected: <span className="font-semibold">{resumeFile.name}</span></p>
                )}
              </div>

              <div className="flex gap-4">
              <button className="flex-1 px-8 py-4 bg-blue text-white rounded-lg font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2" onClick={handleApply}>
                📤 Apply Now
              </button>
              <button className={`px-8 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${isSaved ? 'bg-red-500 text-white hover:opacity-90' : 'bg-gray-200  text-gray-800  hover:bg-gray-300 '}`} onClick={handleSaveJob}>
                {isSaved ? '❤️ Saved' : '🤍 Save Job'}
              </button>
              </div>
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

