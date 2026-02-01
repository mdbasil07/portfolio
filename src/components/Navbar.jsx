import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Navbar() {
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const [hoveredLink, setHoveredLink] = useState(null);
    const navRef = useRef(null);
    const linkRefs = useRef({});
    const location = useLocation();
    const navigate = useNavigate();

    const navLinks = [
        { path: "/", label: "About" },
        { path: "/projects", label: "Projects" },
        { path: "/learning", label: "Learning" },
        { path: "/connect", label: "Connect" },
    ];

    // Get current active path
    const currentPath = location.pathname;

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
            <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                {/* Logo */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                    <span className="w-3 h-3 bg-black"></span>
                    <span className="text-base font-bold tracking-wide">PORTFOLIO.EXE</span>
                </button>

                {/* Navigation Links */}
                <div ref={navRef} className="relative flex items-center gap-2">
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
                  px-5 py-2.5
                  text-sm font-bold
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
        </nav>
    );
}

export default Navbar;
