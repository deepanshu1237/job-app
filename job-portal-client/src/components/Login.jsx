import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className='h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Choose your login type to continue</p>
        </div>
        
        <div className="space-y-3">
          <Link to="/login/company" className="block w-full py-3 px-4 border-2 border-blue rounded-lg bg-blue text-white font-bold text-lg hover:opacity-90 transition transform hover:scale-105">
            🏢 Company Login
          </Link>
          <Link to="/login/seeker" className="block w-full py-3 px-4 border-2 border-blue rounded-lg text-blue font-bold text-lg hover:bg-blue-50 transition transform hover:scale-105">
            👤 Job Seeker Login
          </Link>
        </div>
        
        <p className="mt-6 text-gray-600">Don't have an account? 
          <Link to="/sign-up" className="text-blue font-bold hover:underline"> Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
