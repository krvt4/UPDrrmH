import React from "react";
import UPLogo from "../../assets/UP.png";
import UPDrrm from "../../assets/updrrm.png";
import UPNAME from "../../assets/dname-yw-v2.png";

const AdminHeader = ({ onMenuToggle }) => {
    return (
        <header className="w-full bg-red-900 text-white p-4 flex justify-between items-center md:hidden fixed top-0 left-0 z-50">
            <div className="flex items-center gap-2">
                <img src={UPLogo} alt="UP Logo" className="h-10 w-auto" />
                <img src={UPDrrm} alt="UP DRRM" className="h-10 w-auto" />
                <div className="h-10 border-l-2 border-white"></div>
                <img src={UPNAME} alt="UP Name" className="h-10 w-auto" />
            </div>
            <button onClick={onMenuToggle} aria-label="Open Menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </header>
    );
};

export default AdminHeader;
