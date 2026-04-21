import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiUrl } from '../utils/api';

const CompanySignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !companyName || !password) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please fill all fields' });
      return;
    }
    try {
      const res = await fetch(apiUrl('/company/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, companyName, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to signup company');
      Swal.fire({ icon: 'success', title: 'Company created', timer: 2000 });
      navigate('/login/company', { replace: true });
    } catch (err) {
      console.error('Company signup error:', err.message);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  return (
    <div className='h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100'>
      <form onSubmit={handleSignup} className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-3xl font-bold text-gray-800">Company Sign Up</h2>
          <p className="text-gray-600 mt-2">Start recruiting talent today</p>
        </div>
        
        <div className="space-y-4">
          <input 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition" 
            placeholder="👤 Your Name" 
            value={name} 
            onChange={(e)=>setName(e.target.value)}
            required 
          />
          <input 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition" 
            placeholder="🏷️ Company Name" 
            value={companyName} 
            onChange={(e)=>setCompanyName(e.target.value)}
            required 
          />
          <input 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition" 
            placeholder="📧 Email" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition" 
            placeholder="🔒 Password" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)}
            required 
          />
          <button className="w-full bg-blue text-white p-3 rounded-lg font-bold text-lg hover:opacity-90 transition" type="submit">
            Sign Up as Company
          </button>
        </div>
        
        <p className="text-center text-gray-600 mt-6">
          Already have an account? <a href="/login/company" className="text-blue font-bold hover:underline">Login here</a>
        </p>
      </form>
    </div>
  );
};

export default CompanySignup;
