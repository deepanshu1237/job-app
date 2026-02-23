import React from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  return (
    <div className='h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100'>
      <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Get Started</h2>
          <p className="text-gray-600">Create your account and start your journey</p>
        </div>
        
        <div className="space-y-3">
          <Link to="/sign-up/company" className="block w-full py-3 px-4 border-2 border-green-600 rounded-lg bg-green-600 text-white font-bold text-lg hover:opacity-90 transition transform hover:scale-105">
            🏢 Company Sign Up
          </Link>
          <Link to="/sign-up/seeker" className="block w-full py-3 px-4 border-2 border-green-600 rounded-lg text-green-600 font-bold text-lg hover:bg-green-50 transition transform hover:scale-105">
            👤 Job Seeker Sign Up
          </Link>
        </div>
        
        <p className="mt-6 text-gray-600">Already have an account? 
          <Link to="/login" className="text-green-600 font-bold hover:underline"> Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

