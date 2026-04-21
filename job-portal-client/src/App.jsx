
import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className='min-h-screen w-full'>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <Outlet/>
    </div>
  )
}

export default App
