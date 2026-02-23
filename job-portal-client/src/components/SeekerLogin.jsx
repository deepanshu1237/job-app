import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const SeekerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const rawToken = data.token || '';
      const token = rawToken.replace(/^"|"$/g, '').trim();
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', email);
      Swal.fire({ icon: 'success', title: 'Logged in', timer: 2000 });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Seeker login error:', err.message);
      Swal.fire({ icon: 'error', title: 'Login Failed', text: err.message });
    }
  };

  return (
    <div className='h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100'>
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-3xl font-bold text-gray-800">Job Seeker Login</h2>
          <p className="text-gray-600 mt-2">Find your dream job today</p>
        </div>
        
        <div className="space-y-4">
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
            Login as Seeker
          </button>
        </div>
        
        <p className="text-center text-gray-600 mt-6">
          New seeker? <a href="/sign-up/seeker" className="text-purple-600 font-bold hover:underline">Create account</a>
        </p>
      </form>
    </div>
  );
};

export default SeekerLogin;
