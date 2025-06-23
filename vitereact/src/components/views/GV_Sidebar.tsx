import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

const GV_Sidebar: React.FC = () => {
  // State to manage mobile sidebar open state
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div className={`${isMobileOpen ? "block" : "hidden"} fixed inset-0 z-40 md:hidden`}>
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={() => setMobileOpen(false)}
        ></div>
        {/* Mobile sidebar panel */}
        <div className="relative bg-gray-800 w-64 h-full">
          <div className="p-4 flex items-center justify-between">
            <span className="text-lg font-bold">Menu</span>
            <button onClick={() => setMobileOpen(false)} className="focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav>
            <ul className="mt-4">
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                  <span className="mr-2">🏠</span>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link to="/properties" onClick={() => setMobileOpen(false)} className="flex items-center">
                  <span className="mr-2">📋</span>
                  <span>Properties</span>
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link
                  to="/properties/create"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center"
                >
                  <span className="mr-2">➕</span>
                  <span>Create Property</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block bg-gray-800 text-white w-64 h-screen fixed">
        <div className="p-4">
          <h2 className="text-lg font-bold">Menu</h2>
        </div>
        <nav>
          <ul>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/" className="flex items-center">
                <span className="mr-2">🏠</span>
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/properties" className="flex items-center">
                <span className="mr-2">📋</span>
                <span>Properties</span>
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/properties/create" className="flex items-center">
                <span className="mr-2">➕</span>
                <span>Create Property</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-full focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </>
  );
};

export default GV_Sidebar;