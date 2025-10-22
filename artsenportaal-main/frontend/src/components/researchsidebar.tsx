import React from "react";
import { logout } from "../services/auth";
import { useNavigate } from "react-router-dom";

const ResearchSidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="fixed left-0 top-0 w-[265px] bg-[#e8edf8] flex flex-col h-screen p-5 box-border rounded-tl-lg rounded-bl-lg z-40">
      {/* Logo Section */}
      <div className="flex items-center justify-center mb-4">
        <img
          src="/Images/JDBLogo.png"
          className="h-[65px] object-contain"
          alt="JDB Logo"
        />
      </div>

      {/* Navigation */}
      <nav>
        <ul className="list-none p-0">
          <li className="flex items-center mb-4">
            <img src="/Icons/Dashboard.svg" alt="Onderzoek Dashboard" className="w-8 h-8 mr-4" />
            <a href="/onderzoek-dashboard" className="text-black no-underline hover:font-bold">
              Onderzoek Dashboard
            </a>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Graph.svg" alt="CMAS Analyse" className="w-8 h-8 mr-4" />
            <a href="/onderzoek/cmas-analyse" className="text-black no-underline hover:font-bold">
              CMAS Analyse
            </a>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Documents.svg" alt="Labresultaten" className="w-8 h-8 mr-4" />
            <a href="/onderzoek/labresultaten" className="text-black no-underline hover:font-bold">
              Labresultaten
            </a>
          </li>
        </ul>

        <ul className="list-none p-0">
          <li className="flex items-center mb-4">
            <img src="/Icons/Plus.svg" alt="Data Export" className="w-8 h-8 mr-4" />
            <a href="/onderzoek/data-export" className="text-black no-underline hover:font-bold">
              Data Export
            </a>
          </li>
          <li className="flex items-center mb-4">
            <img src="/Icons/Graph.svg" alt="Statistieken" className="w-8 h-8 mr-4" />
            <a href="/onderzoek/statistieken" className="text-black no-underline hover:font-bold">
              Statistieken
            </a>
          </li>
        </ul>

        <hr className="border-t-2 border-[#d0d5dd] my-5" />
      </nav>

      {/* Role Indicator */}
      <div className="mb-4 p-3 bg-green-100 rounded-lg">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-green-800">Onderzoeker Modus</span>
        </div>
      </div>

      {/* Settings and Logout */}
      <div className="mt-auto">
        <ul className="list-none p-0">
          <li className="flex items-center mb-4">
            <img src="/Icons/Settings.svg" alt="Instellingen" className="w-8 h-8 mr-4" />
            <a href="/settings" className="text-black no-underline hover:font-bold">
              Instellingen
            </a>
          </li>
          <li className="flex items-center cursor-pointer" onClick={handleLogout}>
            <img src="/Icons/Logout.svg" alt="Uitloggen" className="w-8 h-8 mr-4" />
            <span className="text-black hover:font-bold">
              Uitloggen
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ResearchSidebar; 