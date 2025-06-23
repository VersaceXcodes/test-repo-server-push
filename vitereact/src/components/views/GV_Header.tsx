import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from '@/store/main';

const GV_Header: React.FC = () => {
  const auth_user = useAppStore(state => state.auth_user);
  const notifications = useAppStore(state => state.notifications);
  const clear_auth = useAppStore(state => state.clear_auth);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    clear_auth();
    navigate("/login");
  };

  return (
    <>
      <header className="bg-white shadow fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left section: Logo */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to={auth_user ? "/dashboard" : "/login"} className="text-xl font-bold">
                  Real Estate
                </Link>
              </div>
            </div>
            {/* Right section for desktop */}
            <div className="hidden md:flex items-center">
              {/* Notifications Icon */}
              <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>
              {auth_user ? (
                <>
                  <Link to="/dashboard" className="ml-4 text-gray-800 hover:text-gray-600">
                    {auth_user.name}
                  </Link>
                  <button onClick={handleSignOut} className="ml-4 text-gray-800 hover:text-gray-600">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="ml-4 text-gray-800 hover:text-gray-600">
                    Login
                  </Link>
                  <Link to="/register" className="ml-4 text-gray-800 hover:text-gray-600">
                    Register
                  </Link>
                </>
              )}
            </div>
            {/* Mobile menu button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {menuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to={auth_user ? "/dashboard" : "/login"}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
              >
                Home
              </Link>
              <button className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100 relative">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>
              {auth_user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
                  >
                    {auth_user.name}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      {/* Spacer div to push the content below the header */}
      <div className="pt-16"></div>
    </>
  );
};

export default GV_Header;