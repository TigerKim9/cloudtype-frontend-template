import React from "react";
import { Link, NavLink } from "react-router-dom";

const navClass = ({ isActive }) =>
    `px-3 py-1.5 rounded text-sm font-medium ${
        isActive ? "bg-gray-800 text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

const Header = () => {
    return (
        <div className="bg-white shadow-sm py-4 px-7 mb-6">
            <header>
                <nav className="flex flex-wrap items-center justify-between gap-3">
                    <Link to="/" className="flex items-center space-x-3">
                        <h2 className="font-bold text-xl leading-6 text-gray-800">
                            AI 저작권 연동 시스템
                        </h2>
                        <span className="text-xs text-gray-500">v0.1</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <NavLink to="/copyright" className={navClass}>저작권 검사</NavLink>
                        <NavLink to="/batch" className={navClass}>일괄 검사</NavLink>
                        <NavLink to="/history" className={navClass}>이력</NavLink>
                        <NavLink to="/waitlist" className={navClass}>대기자</NavLink>
                    </div>
                </nav>
            </header>
        </div>
    )
}

export default Header;
