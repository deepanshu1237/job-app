import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom';
import {FaBarsStaggered, FaXmark} from "react-icons/fa6";

import LogoutButton from './LogoutButton';

const Navbar = ({ theme = 'light', onToggleTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const handleMenuToggler = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const isCompany = localStorage.getItem('companyEmail');
    const isSeeker = localStorage.getItem('userEmail');
    
    let navItems = [
        {path: "/", title: "Start a Search"},
        {path: "/salary", title: "Salary Estimate"},
    ];
    
    // Show different items for companies and seekers
    if (isCompany) {
        navItems.push({path: "/post-job", title: "Post a Job"});
        navItems.push({path: "/my-job", title: "My Jobs"});
        navItems.push({path: "/applicants", title: "Applicants"});
    } else if (isSeeker) {
        navItems.push({path: "/applications", title: "My Job Applications"});
        navItems.push({path: "/saved-jobs", title: "Saved Jobs"});
    } else {
        navItems.push({path: "/my-job", title: "My Jobs"});
    }
    const profilePath = isCompany ? '/company-profile' : '/profile';
    const profileLabel = isCompany ? 'Company Profile' : 'My Profile';

  return (
    <header className='w-full bg-white'>
        <nav className="max-w-screen-2xl mx-auto xl:px-24 px-4 flex justify-between items-center py-4">
            <Link to="/" className="flex items-center gap-2 text-2xl text-black">
                <svg className="" 
                width="29" 
                height="30" 
                viewBox="0 0 29 30"
                xmlns="http://www.w3.org/2000/svg"
                fill = "none"
                >
                    <circle
                    cx= "12.0143"
                    cy = "12.5143"
                    r = "12.0143"
                    fill = "#3575E2"
                    fillOpacity = "0.4"
                    />
                    <circle cx = "16.9857" cy = "17.4857" r="12.0143" fill = "#3575E2" />
                </svg>
                <span className="">JobJunction</span>
            </Link>

            {/* {NAV ITEMS FOR LARGE DEVICES} */}
            <ul className="hidden md:flex items-center gap-6 xl:gap-8">
                {
                    navItems.map(({path, title}) => (
                        <li key={path} className="text-base text-primary">
                            <NavLink
                            to={path}
                    className={({ isActive}) => isActive ? "text-blue font-semibold border-b-2 border-blue pb-1" : "hover:text-blue transition" }
                  >
                    {title}
                            </NavLink>
                        </li>
                    ))
                }
            </ul>

            {/* SIGNUP AND LOGIN BUTTON */}
            <div className="text-base text-primary font-medium hidden lg:flex items-center gap-2 xl:gap-3">
                <button
                  onClick={onToggleTheme}
                  className='py-2 px-3 border rounded-lg hover:bg-gray-100 transition whitespace-nowrap flex items-center gap-2'
                  title="Toggle theme"
                >
                  <span className="text-base leading-none">{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <span className="hidden xl:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
                {isCompany || isSeeker ? (
                    <>
                        <Link to={profilePath} className='py-2 px-3 border rounded-lg hover:bg-gray-100 transition whitespace-nowrap'>
                            {profileLabel}
                        </Link>
                        <LogoutButton />
                    </>
                ) : (
                    <>
                        <Link to="/login" className='py-2 px-5 border rounded-lg hover:bg-gray-100 transition'>Login</Link>
                        <Link to="/sign-up" className='py-2 px-5 border rounded-lg bg-blue text-white hover:opacity-90 transition'>Sign up</Link>
                    </>
                )}
            </div>

            {/* MOBILE MENU */}
            <div className="md:hidden block">
                <button onClick={handleMenuToggler}>
                    {
                        isMenuOpen ? <FaXmark className='w-5 h-5 text-primary'/> : <FaBarsStaggered className='w-5 h-5 text-primary'/>
                    }
                </button>
            </div>
        </nav>

        {/* NAV ITEMS FOR MOBILE */}
        <div className={`max-w-screen-2xl mx-auto xl:px-24 px-4 pb-4 ${isMenuOpen ? "" : "hidden"}`}>
            <div className="bg-black py-4 rounded-lg">
            <ul className="">
            {navItems.map(({path, title}) => (
                        <li key={path} className="text-base text-white first:text-white py-1">
                            <NavLink
                            to={path}
                    className={({ isActive}) => isActive ? "active": "" }
                  >
                    {title}
                            </NavLink>
                        </li>
                    ))
                }

                {isCompany || isSeeker ? (
                    <>
                        <li className="text-white py-1">
                            <Link to={profilePath}>{profileLabel}</Link>
                        </li>
                        <li className="text-white py-1">
                            <button onClick={onToggleTheme}>
                              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                            </button>
                        </li>
                        <li className="text-white py-1"><LogoutButton className="w-full" /></li>
                    </>
                ) : (
                    <>
                        <li className="text-white py-1"><Link to="/login">Login</Link></li>
                        <li className="text-white py-1"><Link to="/sign-up">Sign up</Link></li>
                    </>
                )}
            </ul>
            </div>
        </div>
    </header>
  )
}

export default Navbar;
