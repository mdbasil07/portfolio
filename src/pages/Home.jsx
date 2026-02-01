import { Github, Linkedin, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    const techStack = [
        { category: "Frontend", items: ["React.js", "JavaScript", "HTML5", "CSS3", "TailwindCSS"] },
        { category: "Backend", items: ["Node.js", "Express.js", "REST APIs"] },
        { category: "Database", items: ["MongoDB", "MySQL", "PostgreSQL"] },
        { category: "Version Ctrl", items: ["Git", "GitHub"] },
        { category: "Testing", items: ["Postman"] },
        { category: "Desktop App", items: ["Electron.js"] },
        { category: "Mobile", items: ["Android (Java)"] },
        { category: "DevOps", items: ["Docker", "Jenkins", "GitHub Actions", "CI/CD"] },
        { category: "Server", items: ["Linux", "Bash"] },
        { category: "Cloud", items: ["AWS"] },
    ];

    // Flatten all items for the grid display
    const allTechItems = techStack.flatMap(group => group.items);

    return (
        <div>
            {/* Hero Section */}
            <section className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 max-w-7xl mx-auto pt-20">
                {/* Status Badge */}
                <div className="mb-8">
                    <span className="inline-block px-4 py-2 border-2 border-black text-xs tracking-widest">
                        SYSTEM_STATUS: <span className="text-black font-semibold">ONLINE</span>
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold mb-6 leading-tight">
                    <span className="text-black">HELLO, I'M </span>
                    <span className="underline decoration-2 underline-offset-8 glitch" data-text="Basil">Basil</span>
                </h1>

                {/* Role */}
                <h2 className="text-xl md:text-2xl font-semibold mb-4 tracking-wide">
                    Senior Full-Stack Developer
                </h2>

                {/* Comment */}
                <p className="text-sm text-black/50 mb-10 tracking-wide">
                    <span className="text-black/30">//</span>{" "}
                    <span className="text-black">Frontend & Backend Enthusiast</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => navigate("/projects")}
                        className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-semibold tracking-widest hover:bg-black/80 transition-colors"
                    >
                        VIEW PROJECTS
                    </button>
                    <button
                        onClick={() => navigate("/connect")}
                        className="flex items-center gap-2 border-2 border-black text-black px-6 py-3 text-xs font-semibold tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                        LET'S CONNECT
                    </button>
                </div>
            </section>

            {/* About & Tech Stack Section */}
            <section className="bg-[#f4f4f5] px-6 md:px-16 lg:px-24 py-20">
                {/* Two Card Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ABOUT_ME Card */}
                    <div
                        className="border-2 border-black bg-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0px_4px_0px_0px_rgba(156,163,175,1)]"
                    >
                        {/* Window Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            </div>
                            <span className="text-xs font-bold tracking-widest">ABOUT_ME</span>
                            <div className="flex items-center gap-2 text-black/40">
                                <span className="text-xs">—</span>
                                <span className="text-xs">□</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8">
                            <div className="space-y-4 text-sm leading-relaxed text-black/80">
                                <p>
                                    I am a Computer Science Engineering student and Full-Stack Developer
                                    who enjoys building real-world software that solves practical problems.
                                </p>
                                <p>
                                    I design scalable web, desktop, and cloud-based applications using the
                                    MERN stack, Electron, and modern backend architectures. Recently, I have
                                    been expanding into DevOps practices including CI/CD pipelines,
                                    Docker, cloud deployment, and system automation.
                                </p>
                                <p>
                                    I focus on clean architecture, performance, and user-friendly design.
                                    My approach combines development with operations — ensuring software is
                                    not only built well, but deployed reliably and maintained efficiently.
                                </p>
                                <p className="font-medium text-black">
                                    Always Learning, Always Building, Always Improving.
                                </p>
                            </div>

                            {/* Social Icons */}
                            <div className="flex items-center gap-4 mt-8">
                                <a
                                    href="https://github.com/mdbasil07"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                                >
                                    <Github className="w-5 h-5" />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/mdbasil07/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                                >
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a
                                    href="mailto:rmohammedbasil83@gmail.com"
                                    className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                                >
                                    <Mail className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* TECH_STACK Card */}
                    <div
                        className="border-2 border-black bg-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0px_4px_0px_0px_rgba(156,163,175,1)]"
                    >
                        {/* Window Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            </div>
                            <span className="text-xs font-bold tracking-widest">TECH_STACK</span>
                            <div className="flex items-center gap-2 text-black/40">
                                <span className="text-xs">—</span>
                                <span className="text-xs">□</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-3 gap-3">
                                {allTechItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-2.5 border-2 border-black text-center text-xs font-medium hover:bg-black hover:text-white transition-all cursor-default"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
