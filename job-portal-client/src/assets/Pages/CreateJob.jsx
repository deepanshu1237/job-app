import React, { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import { useNavigate } from 'react-router-dom'
import CreatableSelect from "react-select/creatable";
import { apiUrl } from '../../utils/api';

const CreateJob = () => {
    const navigate = useNavigate();
    
    // Redirect if user is not a company
    useEffect(() => {
        const companyEmail = localStorage.getItem('companyEmail');
        const userEmail = localStorage.getItem('userEmail');
        
        if (!companyEmail && userEmail) {
            alert('This feature is only available for companies.');
            navigate('/', { replace: true });
        } else if (!companyEmail && !userEmail) {
            alert('Please login as a company to post a job.');
            navigate('/login', { replace: true });
        }
    }, [navigate]);
    const [selectedOption, setSelectedOption] = useState(null);
    const {
        register,
        handleSubmit,reset,
        formState: { errors },
      } = useForm()
    
      const onSubmit = async (data) => {
        data.skills = selectedOption;
        let companyEmail = localStorage.getItem('companyEmail');
        let token = localStorage.getItem('token');
        if (!token || !companyEmail) {
            alert('Please login as a company before posting a job.');
            return;
          }

          // sanitize token and email
          token = token.replace(/^"|"$/g, '').trim();
          companyEmail = (companyEmail || '').replace(/^"|"$/g, '').trim();
          // attach companyEmail to form (for UI clarity only; server overrides postedBy)
          data.postedBy = companyEmail;

          try {
            console.log('CreateJob - token (sanitized):', token ? `${token.slice(0,8)}...` : null);
            const headers = { 'content-type': 'application/json', 'Authorization': `Bearer ${token}` };
            console.log('CreateJob - headers:', headers);
            console.log('CreateJob - payload:', data);
            const res = await fetch(apiUrl("/post-job"), {
              method: "POST",
              headers,
              body: JSON.stringify(data)
            });

          const result = await res.json();
          if (!res.ok) {
            const msg = result.error || 'Failed to post job';
            alert(msg);
            return;
          }

          console.log(result);
          if (result.acknowledged === true) {
            alert("Job Posted Successfully");
            reset();
          }
        } catch (err) {
          console.error('Post job error:', err);
          alert('Network error while posting job');
        }
      };

        const options = [
            {value: "JavaScript", label: "JavaScript"},
            {value: "HTML", label: "HTML"},
            {value: "CSS", label: "CSS"},
            {value: "DOM", label: "DOM"},
            {value: "Asynchronous Programming", label: "Asynchronous Programming"},
            {value: "React", label: "React"},
            {value: "Node.js", label: "Node.js"},
            {value: "Express.js", label: "Express.js"},
            {value: "MongoDB", label: "MongoDB"},
            {value: "SQL", label: "SQL"},
            {value: "Python", label: "Python"},
            {value: "Java", label: "Java"},
            {value: "C++", label: "C++"},
            {value: "Ruby", label: "Ruby"},
            {value: "PHP", label: "PHP"},
            {value: "Go", label: "Go"},
            {value: "Rust", label: "Rust"},
            {value: "TypeScript", label: "TypeScript"},
            {value: "Angular", label: "Angular"},
            {value: "Vue.js", label: "Vue.js"},
            {value: "Flutter", label: "Flutter"},
            {value: "React Native", label: "React Native"},
            {value: "Ionic", label: "Ionic"},
            {value: "Kotlin", label: "Kotlin"},
            {value: "Swift", label: "Swift"},
            {value: "Other", label: "Other"}
            
    ]

  return (
    <div className='max-w-screen-2xl container mx-auto xl:px-24 px-4 py-10'>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Create a New Job</h1>
        <p className="text-gray-600">Fill in the details below to post your job opening</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>

          {/* First Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Job Title</label>
              <input type="text" placeholder='Enter Job Title' defaultValue={""} 
              {...register("jobTitle", { required: true })} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
            </div>
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Company Name</label>
              <input type="text" placeholder='Ex: Google' 
              {...register("companyName", { required: true })} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
            </div>
          </div>

          {/* 2nd Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Minimum Salary</label>
              <input type="text" placeholder='Ex: 3LPA' 
              {...register("minPrice")} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
            </div>
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Maximum Salary</label>
              <input type="text" placeholder='Ex: 20LPA' 
              {...register("maxPrice", { required: true })} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
            </div>
          </div>

          {/* Third Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Salary Type</label>
              <select {...register("salaryType", { required: true })} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'>
                <option value="">Choose Salary Type</option>
                <option value="Hourly">Hourly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Job Location</label>
              <input type="text" placeholder='Ex: Seattle' 
              {...register("jobLocation", { required: true })} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
            </div>
          </div>

          {/* Fourth Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Job Posting Date</label>
              <input type="date" placeholder='Ex: 24-05-30' 
              {...register("postingDate")} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
            </div>
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Experience Level</label>
              <select {...register("experienceLevel", { required: true })} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'>
                <option value="">Choose Experience Type</option>
                <option value="Fresher/No Experience">Fresher</option>
                <option value="Internship">Internship</option>
                <option value="Experienced">Experienced</option>
              </select>
            </div>
          </div>

          {/* Requirements Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Minimum Experience Required (years)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder='Ex: 2'
                {...register("minExperienceYears")}
                className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'
              />
            </div>
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Minimum Skill Match (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                placeholder='Ex: 60'
                {...register("minSkillMatch")}
                className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'
              />
              <p className="text-sm text-gray-500 mt-2">Based on required skill sets vs student profile skills.</p>
            </div>
          </div>

          {/* Fifth Row */}
          <div>
            <label className='block mb-2 text-lg font-semibold text-gray-700'>Required Skill Sets</label>
            <CreatableSelect
            defaultValue={selectedOption}
            onChange={setSelectedOption}
            options={options}
            isMulti
            className='rounded-lg border-2 border-gray-300'
            styles={{
              control: (base) => ({
                ...base,
                borderColor: '#e5e7eb',
                '&:hover': { borderColor: '#3575E2' },
                boxShadow: 'none',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
              })
            }}/>
          </div>

          {/* Sixth Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Company Logo</label>
              <input type="url" placeholder='Ex: Your Company Logo URL' 
              {...register("companyLogo")} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
            </div>
            <div>
              <label className='block mb-2 text-lg font-semibold text-gray-700'>Employment Type</label>
              <select {...register("employmentType", { required: true })} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'>
                <option value="">Choose Employment Type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>

          {/* 7th Row */}
          <div>
            <label className='block mb-2 text-lg font-semibold text-gray-700'>Job Description</label>
            <textarea className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition' 
            rows={6}
            defaultValue={""}
            placeholder='Enter Job Description'
            {...register("description", { required: true })}
            style={{ resize: 'vertical' }}/>
          </div>

          {/* Last Row */}
          <div>
            <label className='block mb-2 text-lg font-semibold text-gray-700'>Employee Email</label>
            <input type="email" placeholder='Ex: employee@gmail.com' 
            defaultValue={localStorage.getItem('companyEmail') || ''} {...register("postedBy")} className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none transition'/>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex gap-4">
            <button type="submit" className='bg-blue text-white font-bold px-8 py-3 rounded-lg hover:opacity-90 transition flex items-center gap-2'>
              ✓ Post Job
            </button>
            <button type="reset" className='bg-gray-300 text-gray-700 font-bold px-8 py-3 rounded-lg hover:bg-gray-400 transition'>
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateJob
