import {createBrowserRouter} from "react-router-dom";
import App from "../App";
import Home from "../assets/Pages/Home";
import About from "../assets/Pages/About";
import CreateJob from "../assets/Pages/CreateJob";
import MyJobs from "../assets/Pages/MyJobs";
import SalaryPage from "../assets/Pages/SalaryPage";
import UpdateJob from "../assets/Pages/UpdateJob";
import Login from "../components/Login";
import CompanyLogin from "../components/CompanyLogin";
import SeekerLogin from "../components/SeekerLogin";
import JobDetails from "../assets/Pages/JobDetails";
import Signup from "../components/Signup";
import CompanySignup from "../components/CompanySignup";
import SeekerSignup from "../components/SeekerSignup";
import Applications from "../assets/Pages/Applications";
import SavedJobs from "../assets/Pages/SavedJobs";
import Applicants from "../assets/Pages/Applicants";
import UserProfile from "../assets/Pages/UserProfile";
import CompanyProfile from "../assets/Pages/CompanyProfile";
import AdminDashboard from "../assets/Pages/AdminDashboard";
import { apiUrl } from "../utils/api";

const router = createBrowserRouter([
    {
      path: "/",
      element: <App/>,
      children: [
        {path: "/", element: <Home/>},
        {
          path: "/post-job",
          element: <CreateJob/>
        },
        
        {
          path: "/my-job",
          element: <MyJobs/>
        },
        {
          path: "/salary",
          element: <SalaryPage/>
        },
        {
          path: "/edit-job/:id",
          element: <UpdateJob/>,
          loader: ({params}) => fetch(apiUrl(`/all-jobs/${params.id}`))
        },
        {
          path: "/job/:id",
          element: <JobDetails/>
        },
        {
          path: "/applications",
          element: <Applications/>
        },
        {
          path: "/saved-jobs",
          element: <SavedJobs/>
        },
        {
          path: "/applicants",
          element: <Applicants/>
        },
        {
          path: "/profile",
          element: <UserProfile/>
        },
        {
          path: "/company-profile",
          element: <CompanyProfile/>
        },
        {
          path: "/admin",
          element: <AdminDashboard/>
        },
        {
          path: "/about",
          element: <About/>
        }

    ],
    },

    {
      path: "/login",
      element: <Login/>
    },
    {
      path: "/login/company",
      element: <CompanyLogin/>
    },
    {
      path: "/login/seeker",
      element: <SeekerLogin/>
    },
    {
      path: "/sign-up",
      element: <Signup/>
    }
    ,
    {
      path: "/sign-up/company",
      element: <CompanySignup/>
    },
    {
      path: "/sign-up/seeker",
      element: <SeekerSignup/>
    }

  ]);

  export default router;
