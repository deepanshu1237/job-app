import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Swal from 'sweetalert2';
import { apiUrl } from '../../utils/api';

const Applicants = () => {
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [noteTextByApp, setNoteTextByApp] = useState({});
  const [tagTextByApp, setTagTextByApp] = useState({});
  const [messagesByApp, setMessagesByApp] = useState({});
  const [newMessageByApp, setNewMessageByApp] = useState({});
  const [interviewsByApp, setInterviewsByApp] = useState({});
  const [slotsTextByApp, setSlotsTextByApp] = useState({});
  const [referrals, setReferrals] = useState([]);
  const navigate = useNavigate();
  
  const companyEmail = localStorage.getItem('companyEmail');
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (!companyEmail) {
      Swal.fire({ icon: 'error', title: 'Unauthorized', text: 'Companies only' });
      navigate('/login/company', { replace: true });
      return;
    }
    
    setIsLoading(true);
    fetch(apiUrl(`/applicants/${companyEmail}`), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch applicants');
        return data;
      })
      .then(data => {
        setApplicants(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applicants:', err);
        setApplicants([]);
        Swal.fire({ icon: 'error', title: 'Applicants unavailable', text: err.message || 'Unable to load applicants right now.' });
        setIsLoading(false);
      });

    fetch(apiUrl('/referrals/incoming'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setReferrals(Array.isArray(data) ? data : []))
      .catch(() => setReferrals([]));
  }, [companyEmail, navigate]);

  const updateReferralStatus = async (id, status) => {
    try {
      const res = await fetch(apiUrl(`/referrals/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReferrals((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      }
    } catch (e) {
      console.error('Referral update error:', e);
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
  
  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await fetch(apiUrl(`/application/${appId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const handleStageChange = async (appId, stage) => {
    try {
      const res = await fetch(apiUrl(`/application/${appId}/stage`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ stage })
      });
      if (res.ok) {
        setApplicants(applicants.map(app => app._id === appId ? { ...app, stage } : app));
        Swal.fire({ icon: 'success', title: `Stage updated to ${stage}`, timer: 1500 });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const addNote = async (appId) => {
    const text = (noteTextByApp[appId] || '').trim();
    if (!text) return;
    try {
      const res = await fetch(apiUrl(`/application/${appId}/notes`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (res.ok) {
        setApplicants(applicants.map(app => app._id === appId ? { ...app, notes: [...(app.notes || []), data.note] } : app));
        setNoteTextByApp((p) => ({ ...p, [appId]: '' }));
      }
    } catch (e) {
      console.error('Add note error:', e);
    }
  };

  const updateTags = async (appId) => {
    const raw = (tagTextByApp[appId] || '').trim();
    const tags = raw ? raw.split(',').map(t => t.trim()).filter(Boolean) : [];
    try {
      const res = await fetch(apiUrl(`/application/${appId}/tags`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tags })
      });
      const data = await res.json();
      if (res.ok) {
        setApplicants(applicants.map(app => app._id === appId ? { ...app, tags: data.tags } : app));
        Swal.fire({ icon: 'success', title: 'Tags updated', timer: 1200 });
      }
    } catch (e) {
      console.error('Update tags error:', e);
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

  const proposeInterview = async (appId) => {
    const raw = (slotsTextByApp[appId] || '').trim();
    if (!raw) return;
    const slots = raw.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const res = await fetch(apiUrl(`/application/${appId}/interviews/propose`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slots }),
      });
      if (res.ok) {
        setSlotsTextByApp((p) => ({ ...p, [appId]: '' }));
        await loadThread(appId);
        Swal.fire({ icon: 'success', title: 'Interview slots proposed', timer: 1500 });
      }
    } catch (e) {
      console.error('Propose interview error:', e);
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
        {referrals.length > 0 && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3">Referral Requests</h3>
            <div className="space-y-3">
              {referrals.slice(0, 8).map((r) => (
                <div key={r._id} className="bg-white border rounded-lg p-3">
                  <div className="text-sm text-gray-700"><span className="font-semibold">{r.jobTitle}</span> - {r.seekerEmail}</div>
                  <div className="text-sm text-gray-600 mb-2">Status: <span className="uppercase font-semibold">{r.status}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => updateReferralStatus(r._id, 'accepted')} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>
                    <button onClick={() => updateReferralStatus(r._id, 'rejected')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                    <button onClick={() => updateReferralStatus(r._id, 'referred')} className="px-3 py-1 bg-indigo-600 text-white rounded">Marked Referred</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
              {(Array.isArray(applicants) ? applicants : []).map((app) => {
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
                        {app.seekerProfile && (
                          <div className="mt-3 text-sm text-gray-700">
                            <p><span className="font-semibold">Candidate:</span> {app.seekerProfile.name || 'N/A'}</p>
                            <p><span className="font-semibold">Experience:</span> {app.seekerProfile.experienceYears ?? 0} years</p>
                            <p>
                              <span className="font-semibold">Skills:</span> {Array.isArray(app.seekerProfile.skills) && app.seekerProfile.skills.length > 0 ? app.seekerProfile.skills.join(', ') : 'N/A'}
                            </p>
                            <p>
                              <span className="font-semibold">Proof links:</span> {Array.isArray(app.seekerProfile.proofLinks) && app.seekerProfile.proofLinks.length > 0 ? app.seekerProfile.proofLinks.length : 0}
                            </p>
                          </div>
                        )}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${colors.badge}`}>
                        {getStatusIcon(app.status)} {app.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {app.resume?.url && (
                      <div className="mb-4">
                        <a
                          href={apiUrl(`${app.resume.url}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:opacity-90 transition"
                        >
                          📄 Download Resume
                        </a>
                        {app.resume?.originalName && (
                          <span className="ml-3 text-sm text-gray-600">({app.resume.originalName})</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        onClick={async () => {
                          const next = openId === app._id ? null : app._id;
                          setOpenId(next);
                          if (next) await loadThread(app._id);
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:opacity-90 transition"
                      >
                        {openId === app._id ? 'Hide Manage' : 'Manage'}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">Stage</span>
                        <select
                          value={app.stage || 'new'}
                          onChange={(e) => handleStageChange(app._id, e.target.value)}
                          className="border rounded-lg px-3 py-2 bg-white"
                        >
                          <option value="new">New</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
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

                    {openId === app._id && (
                      <div className="mt-6 grid md:grid-cols-2 gap-6">
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-bold text-gray-800 mb-3">Notes & Tags</h4>
                          <div className="flex gap-2 mb-3">
                            <input
                              value={noteTextByApp[app._id] || ''}
                              onChange={(e) => setNoteTextByApp((p) => ({ ...p, [app._id]: e.target.value }))}
                              className="flex-1 border rounded-lg px-3 py-2"
                              placeholder="Add a note about this candidate..."
                            />
                            <button
                              onClick={() => addNote(app._id)}
                              className="px-4 py-2 bg-blue text-white rounded-lg font-semibold hover:opacity-90"
                            >
                              Add
                            </button>
                          </div>
                          {(app.notes || []).length > 0 && (
                            <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-auto">
                              {(app.notes || []).slice().reverse().map((n) => (
                                <div key={n.id} className="mb-2">
                                  <div className="text-xs text-gray-500">{new Date(n.at).toLocaleString()}</div>
                                  <div className="text-sm text-gray-800">{n.text}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
                            <div className="flex gap-2">
                              <input
                                value={tagTextByApp[app._id] ?? (Array.isArray(app.tags) ? app.tags.join(', ') : '')}
                                onChange={(e) => setTagTextByApp((p) => ({ ...p, [app._id]: e.target.value }))}
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="e.g. react, strong-communication, remote"
                              />
                              <button
                                onClick={() => updateTags(app._id)}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:opacity-90"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-bold text-gray-800 mb-3">Messages</h4>
                          <div className="h-40 overflow-auto border rounded-lg p-3 bg-gray-50">
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
                              placeholder="Message the candidate..."
                            />
                            <button
                              onClick={() => sendMessage(app._id)}
                              className="px-4 py-2 bg-blue text-white rounded-lg font-semibold hover:opacity-90"
                            >
                              Send
                            </button>
                          </div>

                          <div className="mt-5">
                            <h5 className="font-bold text-gray-800 mb-2">Interview slots</h5>
                            <p className="text-xs text-gray-500 mb-2">Enter ISO datetimes separated by commas. Example: 2026-04-25T10:00:00Z, 2026-04-25T12:00:00Z</p>
                            <div className="flex gap-2">
                              <input
                                value={slotsTextByApp[app._id] || ''}
                                onChange={(e) => setSlotsTextByApp((p) => ({ ...p, [app._id]: e.target.value }))}
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="ISO slots..."
                              />
                              <button
                                onClick={() => proposeInterview(app._id)}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:opacity-90"
                              >
                                Propose
                              </button>
                            </div>

                            {(interviewsByApp[app._id] || []).length > 0 && (
                              <div className="mt-3 border rounded-lg p-3 bg-gray-50 max-h-40 overflow-auto">
                                {(interviewsByApp[app._id] || []).slice().reverse().map((iv) => (
                                  <div key={iv.id} className="mb-3">
                                    <div className="text-sm font-semibold text-gray-700">Status: {iv.status}</div>
                                    {iv.selectedSlot && (
                                      <div className="text-sm text-gray-700">
                                        Selected: <span className="font-semibold">{new Date(iv.selectedSlot).toLocaleString()}</span>
                                        <a
                                          className="ml-3 text-blue underline"
                                          href={apiUrl(`/application/${app._id}/interviews/${iv.id}/ics`)}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          .ics
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
