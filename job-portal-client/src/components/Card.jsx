import React from 'react'
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiDollarSign, FiMapPin } from 'react-icons/fi';

const Card = ({data}) => {
const {_id, companyName, jobTitle, companyLogo, minPrice, maxPrice, salaryType, jobLocation, employmentType, postingDate, description} = data;

  return (
   <Link to={`/job/${_id}`} className='no-underline'>
    <section className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 h-full">
      <div className="flex gap-4 mb-4">
        {companyLogo && (
          <img src={companyLogo} alt={companyName} className="w-16 h-16 object-contain" />
        )}
        <div className="flex-grow">
          <p className="text-sm text-blue font-semibold uppercase">{companyName}</p>
          <h3 className="text-lg font-bold text-gray-800 hover:text-blue transition">{jobTitle}</h3>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <FiMapPin className="text-blue" /> {jobLocation}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <FiClock className="text-blue" /> {employmentType}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <FiDollarSign className="text-blue" /> {minPrice}-{maxPrice}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <FiCalendar className="text-blue" /> {postingDate}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-3 mb-4">{description}</p>

      <div className="pt-3 border-t border-gray-200">
        <button className="text-blue font-semibold hover:text-white hover:bg-blue px-4 py-2 rounded transition">
          View Details →
        </button>
      </div>
    </section>
   </Link>
  )
}

export default Card
