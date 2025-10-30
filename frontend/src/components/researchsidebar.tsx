import React from "react";

export interface ResearchSidebarProps {
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
}

const ResearchSidebar: React.FC<ResearchSidebarProps> = ({ sidebarExpanded, toggleSidebar }) => {
    return (
        <div
            className={`fixed left-0 top-0 h-screen flex flex-col z-40 transition-all duration-300 ease-in-out
      ${sidebarExpanded ? "w-[265px] bg-green-100 p-5" : "w-24 bg-[#e8edf8] p-2"}`}
        >
            <div
                onClick={toggleSidebar}
                className="absolute top-4 left-4 cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md z-50"
            >
                <svg
                    className={`w-5 h-5 transition-transform duration-300 ${sidebarExpanded ? "" : "rotate-180"
                        }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </div>
            <div className={`flex items-center justify-center mb-4 transition-opacity duration-300 ${sidebarExpanded ? "opacity-100" : "opacity-0"}`}>
                <h1 className="text-xl font-bold">Research Sidebar</h1>
            </div>
        </div>
    );
};

export default ResearchSidebar;
