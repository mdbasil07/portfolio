import { Github, Linkedin, Mail } from "lucide-react";

function Footer() {
    return (
        <footer className="border-t-2 border-black py-6 sm:py-8 px-4 sm:px-6 md:px-16 lg:px-24 bg-[#ffffff]">
            <div className="max-w-7xl mx-auto text-center">
                {/* Copyright */}
                <p className="text-[10px] sm:text-xs font-bold tracking-wide mb-2">
                    © 2026 SYSTEM_ADMIN. ALL RIGHTS RESERVED.
                </p>

                {/* Credits Line */}
                <p className="text-[8px] sm:text-[10px] text-black/40 tracking-wide mb-4 sm:mb-5">
                    CRAFTED_BY_BASIL // SYSTEM_UPTIME_100% // [V.1.0.1-STABLE]
                </p>

                {/* Social Icons */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <a
                        href="https://github.com/mdbasil07"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-black hover:text-white transition-all"
                    >
                        <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                    <a
                        href="https://www.linkedin.com/in/mdbasil07/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-black hover:text-white transition-all"
                    >
                        <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                    <a
                        href="mailto:rmohammedbasil83@gmail.com"
                        className="p-1.5 hover:bg-black hover:text-white transition-all"
                    >
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
