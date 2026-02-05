import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

function Navbar() {
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const [hoveredLink, setHoveredLink] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navRef = useRef(null);
    const linkRefs = useRef({});
    const location = useLocation();
    const navigate = useNavigate();

    const navLinks = [
        { path: "/", label: "About" },
        { path: "/projects", label: "Projects" },
        { path: "/learning", label: "Learning" },
        { path: "/connect", label: "Connect" },
        { path: "/ats", label: "ATS Checker" },
    ];

    // Get current active path
    const currentPath = location.pathname;

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    // Update indicator position when active path changes
    useEffect(() => {
        const updateIndicator = () => {
            const activeLink = linkRefs.current[currentPath];
            const navContainer = navRef.current;

            if (activeLink && navContainer) {
                const navRect = navContainer.getBoundingClientRect();
                const linkRect = activeLink.getBoundingClientRect();

                setIndicatorStyle({
                    left: linkRect.left - navRect.left,
                    width: linkRect.width,
                });
            }
        };

        // Small delay to ensure DOM is ready
        setTimeout(updateIndicator, 50);
        window.addEventListener("resize", updateIndicator);
        return () => window.removeEventListener("resize", updateIndicator);
    }, [currentPath]);

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#ffffff] border-b-2 border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                {/* Logo */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                    <span className="w-3 h-3 bg-black"></span>
                    <span className="text-sm sm:text-base font-bold tracking-wide">PORTFOLIO.EXE</span>
                </button>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 border-2 border-black"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Desktop Navigation Links */}
                <div ref={navRef} className="relative hidden md:flex items-center gap-2">
                    {/* Sliding Active Indicator */}
                    <div
                        className="absolute top-0 h-full bg-black transition-all duration-500 ease-out"
                        style={{
                            left: `${indicatorStyle.left}px`,
                            width: `${indicatorStyle.width}px`,
                        }}
                    />

                    {/* Nav Links */}
                    {navLinks.map((link) => {
                        const isActive = currentPath === link.path;
                        const isHovered = hoveredLink === link.path;

                        return (
                            <button
                                key={link.path}
                                ref={(el) => (linkRefs.current[link.path] = el)}
                                onClick={() => navigate(link.path)}
                                onMouseEnter={() => setHoveredLink(link.path)}
                                onMouseLeave={() => setHoveredLink(null)}
                                className={`
                                    relative z-10
                                    px-4 lg:px-5 py-2.5
                                    text-xs lg:text-sm font-bold
                                    tracking-wider
                                    uppercase
                                    transition-all duration-200
                                    ${isActive
                                        ? "text-white"
                                        : isHovered
                                            ? "text-black border-2 border-black"
                                            : "text-black border-2 border-transparent"
                                    }
                                `}
                            >
                                {link.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t-2 border-black bg-white">
                    <div className="flex flex-col">
                        {navLinks.map((link) => {
                            const isActive = currentPath === link.path;
                            return (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    className={`
                                        px-6 py-4
                                        text-sm font-bold
                                        tracking-wider
                                        uppercase
                                        text-left
                                        border-b border-black/10
                                        transition-all duration-200
                                        ${isActive ? "bg-black text-white" : "text-black hover:bg-black/5"}
                                    `}
                                >
                                    {link.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
