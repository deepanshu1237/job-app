import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../utils/api';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [messagesByApp, setMessagesByApp] = useState({});
  const [newMessageByApp, setNewMessageByApp] = useState({});
  const [interviewsByApp, setInterviewsByApp] = useState({});
  const [referrals, setReferrals] = useState([]);
  const navigate = useNavigate();
  
  const userEmail = localStorage.getItem('userEmail');
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (!userEmail) {
      navigate('/login/seeker', { replace: true });
      return;
    }
    
    setIsLoading(true);
    fetch(apiUrl(`/my-applications/${userEmail}`), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setApplications(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applications:', err);
        setIsLoading(false);
      });

    fetch(apiUrl('/referrals/outgoing'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setReferrals(Array.isArray(data) ? data : []))
      .catch(() => setReferrals([]));
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

  const loadThread = async (appId) => {
    try {
      const [mRes, iRes] = await Promise.all([
        fetch(apiUrl(`/application/${appId}/messages`), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(apiUrl(`/application/${appId}/interviews`), { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const msgs = await mRes.json();
      const ints = await iRes.json();
      setMessagesByApp((p) => ({ ...p, [appId]: Array.isArray(msgs) ? msgs : [] }));
      setInterviewsByApp((p) => ({ ...p, [appId]: Array.isArray(ints) ? ints : [] }));
    } catch (e) {
      console.error('Thread load error:', e);
    }
  };

  const sendMessage = async (appId) => {
    const text = (newMessageByApp[appId] || '').trim();
    if (!text) return;
    try {
      const res = await fetch(apiUrl(`/application/${appId}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewMessageByApp((p) => ({ ...p, [appId]: '' }));
        setMessagesByApp((p) => ({ ...p, [appId]: [...(p[appId] || []), data.message] }));
      }
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

  const acceptInterview = async (appId, interviewId, selectedSlot) => {
    try {
      const res = await fetch(apiUrl(`/application/${appId}/interviews/${interviewId}/respond`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ selectedSlot }),
      });
      if (res.ok) {
        await loadThread(appId);
      }
    } catch (e) {
      console.error('Accept interview error:', e);
    }
  };

  return (
    <div className="max-w-screen-2xl container mx-auto xl:px-24 px-4 bg-gray-50 min-h-screen">
      <div className="py-16">
        {referrals.length > 0 && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-2">Referral Requests</h3>
            <div className="space-y-2">
              {referrals.slice(0, 5).map((r) => (
                <div key={r._id} className="text-sm text-gray-700">
                  <span className="font-semibold">{r.jobTitle}</span> - <span className="uppercase">{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
                      {app.resume?.originalName && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                          <span>📄</span>
                          Resume: <span className="font-semibold">{app.resume.originalName}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-center">
                      <span className={`inline-block px-4 py-2 rounded-full font-bold ${colors.badge} ${colors.text}`}>
                        {getStatusIcon(app.status)} {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        const next = openId === app._id ? null : app._id;
                        setOpenId(next);
                        if (next) await loadThread(app._id);
                      }}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      {openId === app._id ? 'Hide Details' : 'View Details'}
                    </button>
                    {app.stage && (
                      <span className="px-3 py-2 rounded-lg bg-white border text-sm font-semibold text-gray-700">
                        ATS Stage: {app.stage}
                      </span>
                    )}
                  </div>

                  {openId === app._id && (
                    <div className="mt-6 grid md:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-bold text-gray-800 mb-3">Messages</h4>
                        <div className="h-48 overflow-auto border rounded-lg p-3 bg-gray-50">
                          {(messagesByApp[app._id] || []).length === 0 ? (
                            <p className="text-sm text-gray-500">No messages yet.</p>
                          ) : (
                            (messagesByApp[app._id] || []).map((m) => (
                              <div key={m.id} className="mb-3">
                                <div className="text-xs text-gray-500">
                                  {m.senderRole} • {m.senderEmail} • {new Date(m.at).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-800">{m.text}</div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <input
                            value={newMessageByApp[app._id] || ''}
                            onChange={(e) => setNewMessageByApp((p) => ({ ...p, [app._id]: e.target.value }))}
                            className="flex-1 border rounded-lg px-3 py-2"
                            placeholder="Type a message..."
                          />
                          <button
                            onClick={() => sendMessage(app._id)}
                            className="px-4 py-2 bg-blue text-white rounded-lg font-semibold hover:opacity-90"
                          >
                            Send
                          </button>
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-bold text-gray-800 mb-3">Interview Scheduling</h4>
                        {(interviewsByApp[app._id] || []).length === 0 ? (
                          <p className="text-sm text-gray-500">No interview proposals yet.</p>
                        ) : (
                          (interviewsByApp[app._id] || []).map((iv) => (
                            <div key={iv.id} className="border rounded-lg p-3 mb-3">
                              <div className="text-sm font-semibold text-gray-700">
                                Status: <span className="font-bold">{iv.status}</span>
                              </div>
                              {iv.status === 'accepted' && iv.selectedSlot && (
                                <div className="mt-2">
                                  <div className="text-sm text-gray-700">
                                    Selected: <span className="font-semibold">{new Date(iv.selectedSlot).toLocaleString()}</span>
                                  </div>
                                  <a
                                    className="inline-block mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:opacity-90"
                                    href={apiUrl(`/application/${app._id}/interviews/${iv.id}/ics`)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Download Calendar (.ics)
                                  </a>
                                </div>
                              )}
                              {iv.status === 'proposed' && Array.isArray(iv.slots) && (
                                <div className="mt-2">
                                  <div className="text-sm text-gray-700 mb-2">Pick a slot:</div>
                                  <div className="flex flex-col gap-2">
                                    {iv.slots.map((s) => (
                                      <button
                                        key={String(s)}
                                        onClick={() => acceptInterview(app._id, iv.id, s)}
                                        className="text-left px-3 py-2 border rounded-lg hover:bg-gray-50"
                                      >
                                        {new Date(s).toLocaleString()}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
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
