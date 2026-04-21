import { useEffect, useState } from "react";
import Banner from "../../components/Banner"
import Card from "../../components/Card";
import Jobs from "./Jobs";
import Sidebar from "../../sidebar/Sidebar";
import Newsletter from "../../components/Newsletter";
import { computeEligibility } from "../../utils/eligibility";
import { apiUrl } from "../../utils/api";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seekerProfile, setSeekerProfile] = useState(null);
  const[currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setIsLoading(true);
    fetch(apiUrl("/all-jobs")).then(res => res.json()).then(data => {
      setJobs(data);
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const token = localStorage.getItem('token');
    if (!userEmail || !token) {
      setSeekerProfile(null);
      return;
    }
    fetch(apiUrl(`/user-profile/${userEmail}`), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSeekerProfile(data))
      .catch(() => setSeekerProfile(null));
  }, []);

  // console.log(jobs)

  const [query, setQuery] = useState("");
  const handleInputChange = (event) => {
    setQuery(event.target.value)
    setCurrentPage(1);
  }

  // FILTER JOBS BY TITLE (guard missing fields)
  const filteredItems = jobs.filter((job) => {
    const title = (job && job.jobTitle) ? String(job.jobTitle) : '';
    return title.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  })
  // console.log(filteredItems)

  // Radio Filtering

  const handleChange = (event) => {
    setSelectedCategory(event.target.value)
    setCurrentPage(1);
  }

  // Button based Filtering
  const handleClick = (event) => {
    setSelectedCategory(event.target.value)
    setCurrentPage(1);
  }

  //Calculate the index range
  const calculatePageRange = () => {
    const startIndex = (currentPage -1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {startIndex, endIndex};
  }

  // Function for the next page
const nextPage = () => {
  if (currentPage < Math.ceil(filteredItems.length / itemsPerPage)){
    setCurrentPage(currentPage + 1);
  }
}

// Function for the previous page

const prevPage = () => {
  if(currentPage > 1){
    setCurrentPage(currentPage - 1)
  }
}


  //Main Function
  const filteredData = (jobs, selected, query) => {
    let filteredJobs = jobs;

    //Filtering Input Items
    if (query) {
      filteredJobs = filteredItems;
    }

    //Category Filtering (guard each field)
    if (selected) {
      const selLower = String(selected).toLowerCase();
      const selNumber = Number(selected);
      filteredJobs = filteredJobs.filter((job) => {
        const jobLocation = (job.jobLocation || '').toLowerCase();
        const maxPrice = Number(job.maxPrice);
        const postingDate = job.postingDate || '';
        const salaryType = (job.salaryType || '').toLowerCase();
        const experienceLevel = (job.experienceLevel || '').toLowerCase();
        const employmentType = (job.employmentType || '').toLowerCase();

        const matchLocation = jobLocation === selLower;
        const matchPrice = !Number.isNaN(selNumber) && !Number.isNaN(maxPrice) && maxPrice <= selNumber;
        const matchDate = postingDate && postingDate >= selected;
        const matchSalaryType = salaryType === selLower;
        const matchExperience = experienceLevel === selLower;
        const matchEmployment = employmentType === selLower;

        return matchLocation || matchPrice || matchDate || matchSalaryType || matchExperience || matchEmployment;
      });
    }

    // total before pagination
    const total = filteredJobs.length;

    // Slice the data based on current page
    const { startIndex, endIndex } = calculatePageRange();
    const pageSlice = filteredJobs.slice(startIndex, endIndex);

    return {
      items: pageSlice.map((data, i) => {
        const eligibility = computeEligibility({ job: data, seekerProfile });
        return <Card key={i} data={data} eligibility={eligibility} />;
      }),
      total,
    };
  };

  const { items: result, total: totalCount } = filteredData(jobs, selectedCategory, query);

  return (
    <div>
      <Banner query={query} handleInputChange={handleInputChange} />
    
      {/* Main Content */}
      <div className="bg-gradient-to-b from-gray-50  to-white  md:grid grid-cols-4 gap-8 lg:px-24 px-4 py-12">
        {/* Left Side - Sidebar */}
        <div className="bg-white  p-6 rounded-xl shadow-md border border-gray-200  h-fit">
          <Sidebar handleChange={handleChange} handleClick={handleClick}/>
        </div>

        {/* Jobs Cards */}
        <div className="col-span-2 bg-white  p-6 rounded-xl shadow-md border border-gray-200 ">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 ">
              💼 Job Listings
              <span className="text-lg text-blue font-semibold ml-2">({totalCount} jobs)</span>
            </h2>
          </div>

          {
            isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="font-semibold text-gray-600  text-lg">⏳ Loading jobs...</p>
              </div>
            ) : result.length > 0 ? (
              <Jobs result={result} />
            ) : (
              <div className="text-center py-12">
                <p className="text-2xl font-bold text-gray-600  mb-2">🔍 No jobs found</p>
                <p className="text-gray-500 ">Try adjusting your filters or search term</p>
              </div>
            )
          }

          {/* PAGINATION */}
          {result.length > 0 ? (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-300 ">
              <button 
                onClick={prevPage} 
                disabled={currentPage === 1} 
                className="px-5 py-2 bg-blue text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>
              <span className="px-4 py-2 bg-gray-100  rounded-lg font-semibold text-gray-700 ">
                Page {currentPage} of {Math.max(1, Math.ceil(totalCount / itemsPerPage))}
              </span>
              <button 
                onClick={nextPage} 
                disabled={currentPage === Math.ceil(totalCount / itemsPerPage)} 
                className="px-5 py-2 bg-blue text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          ) : ""}
        </div>

        {/* Right Side - Newsletter */}
        <div className="bg-white  p-6 rounded-xl shadow-md border border-gray-200  h-fit">
          <Newsletter/>
        </div>
      </div>
    </div>
  )
}

export default Home

