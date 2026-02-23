import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const SeekerSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !mobile || !password) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter all fields' });
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password }),
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
