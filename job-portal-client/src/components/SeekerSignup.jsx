import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiUrl } from '../utils/api';

const SeekerSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState('');
  const [tenthPercentage, setTenthPercentage] = useState('');
  const [twelfthPercentage, setTwelfthPercentage] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [college, setCollege] = useState('');
  const [passoutYear, setPassoutYear] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !mobile || !password) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter all fields' });
      return;
    }
    const tenth = tenthPercentage === '' ? null : Number(tenthPercentage);
    const twelfth = twelfthPercentage === '' ? null : Number(twelfthPercentage);
    const cgpaNum = cgpa === '' ? null : Number(cgpa);
    const yearNum = passoutYear === '' ? null : Number(passoutYear);
    if ((tenth !== null && (tenth < 0 || tenth > 100)) || (twelfth !== null && (twelfth < 0 || twelfth > 100))) {
      Swal.fire({ icon: 'error', title: 'Invalid marks', text: '10th and 12th percentages must be between 0 and 100.' });
      return;
    }
    if (cgpaNum !== null && (cgpaNum < 0 || cgpaNum > 10)) {
      Swal.fire({ icon: 'error', title: 'Invalid CGPA', text: 'CGPA must be between 0 and 10.' });
      return;
    }
    const currentYear = new Date().getFullYear();
    if (yearNum !== null && (yearNum < 1990 || yearNum > currentYear + 10)) {
      Swal.fire({ icon: 'error', title: 'Invalid passout year', text: `Passout year must be between 1990 and ${currentYear + 10}.` });
      return;
    }
    try {
      const res = await fetch(apiUrl('/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          mobile,
          password,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          tenthPercentage,
          twelfthPercentage,
          cgpa,
          degree,
          branch,
          college,
          passoutYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to signup');
      Swal.fire({ icon: 'success', title: 'Signup Successful', text: `Welcome, ${name}!`, timer: 2000 });
      navigate('/login/seeker', { replace: true });
    } catch (err) {
      console.error('Signup error:', err.message);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  return (
    <div className='h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100'>
      <form onSubmit={handleSignup} className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-3xl font-bold text-gray-800">Job Seeker Sign Up</h2>
          <p className="text-gray-600 mt-2">Start your job search journey</p>
        </div>
        
        <div className="space-y-4">
          <input 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition" 
            placeholder="👤 Name" 
            value={name} 
            onChange={(e)=>setName(e.target.value)}
            required 
          />
          <input 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition" 
            placeholder="📱 Mobile" 
            value={mobile} 
            onChange={(e)=>setMobile(e.target.value)}
            required 
          />
          <input 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition" 
            placeholder="📧 Email" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition" 
            placeholder="🔒 Password" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)}
            required 
          />
          <input
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
            placeholder="🧠 Skills (comma separated)"
            value={skills}
            onChange={(e)=>setSkills(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
              placeholder="10th %"
              value={tenthPercentage}
              onChange={(e)=>setTenthPercentage(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
              placeholder="12th %"
              value={twelfthPercentage}
              onChange={(e)=>setTwelfthPercentage(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
              placeholder="CGPA"
              value={cgpa}
              onChange={(e)=>setCgpa(e.target.value)}
            />
            <input
              type="number"
              min="1990"
              max="2100"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
              placeholder="Passout Year"
              value={passoutYear}
              onChange={(e)=>setPassoutYear(e.target.value)}
            />
          </div>
          <input
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
            placeholder="🎓 Degree (B.Tech, BCA...)"
            value={degree}
            onChange={(e)=>setDegree(e.target.value)}
          />
          <input
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
            placeholder="📚 Branch / Stream"
            value={branch}
            onChange={(e)=>setBranch(e.target.value)}
          />
          <input
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition"
            placeholder="🏫 College Name"
            value={college}
            onChange={(e)=>setCollege(e.target.value)}
          />
          <button className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold text-lg hover:opacity-90 transition" type="submit">
            Sign Up as Seeker
          </button>
        </div>
        
        <p className="text-center text-gray-600 mt-6">
          Already have an account? <a href="/login/seeker" className="text-purple-600 font-bold hover:underline">Login here</a>
        </p>
      </form>
    </div>
  );
};

export default SeekerSignup;
