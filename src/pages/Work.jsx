import { ExternalLink } from "lucide-react";

function Work() {
    const projects = [
        {
            name: "EL-KAID",
            description: "AI-driven billing and finance automation platform with smart invoicing, GST compliance, client & transaction tracking, and real-time analytics. Includes dashboard insights and automated bookkeeping assistance.",
            tech: ["REACT.JS", "TAILWIND", "NODE.JS", "NESTJS", "MONGODB", "REST API"],
            link: "https://www.elkaid.com/",
            featured: true
        },
        {
            name: "B1",
            description: "Cross-platform billing and accounting desktop application designed for offline-first usage, fast performance, and small-business operations. Supports secure authentication, local storage, and seamless sync.",
            tech: ["ELECTRON", "REACT", "NODE.JS", "SQLITE", "MONGODB", "AUTH"],
            link: "https://b1.elkaid.com/",
            featured: true
        },
        {
            name: "WedWise",
            description: "Android wedding planning app for managing tasks, budgets, and events. Features activity-based workflows, server-side sync, and session-based authentication for seamless mobile experience.",
            tech: ["JAVA", "ANDROID", "PHP", "MYSQL", "XAMPP", "HTTP API"],
            link: "https://github.com/mdbasil07/wedwise-pddapp",
            featured: true
        },
        {
            name: "AL-D Platform",
            description: "Dynamic real estate web platform with property listings, smart filters, and responsive UI for fast browsing and client inquiries. Built with a scalable MERN architecture and RESTful backend.",
            tech: ["REACT.JS", "NODE.JS", "EXPRESS", "MONGODB", "MERN", "REST API"],
            link: "https://www.al-d.com/",
            featured: true
        },
        {
            name: "TermTime",
            description: "Full-stack EdTech platform providing course listings, student services, and blog content with modular architecture and scalable backend APIs.",
            tech: ["REACT.JS", "NODE.JS", "EXPRESS", "MONGODB", "MERN", "REST API"],
            link: "https://github.com/idristhetermtime/theTermtime-MERN",
            featured: true
        }
    ];

    return (
        <section className="min-h-screen bg-[#f4f4f5] px-6 md:px-16 lg:px-24 pt-28 pb-20">
            {/* Page Title */}
            <div className="max-w-7xl mx-auto mb-16 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-wide">
                    <span className="glitch" data-text="Projects">Projects</span>
                </h1>
            </div>

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                    <div
                        key={index}
                        className="border-2 border-black bg-white flex flex-col transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0px_4px_0px_0px_rgba(156,163,175,1)]"
                    >
                        {/* Window Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            </div>
                            <span className="text-xs font-bold tracking-widest">
                                {project.featured ? "FEATURED" : "PROJECT"}
                            </span>
                            <div className="flex items-center gap-2 text-black/40">
                                <span className="text-xs">—</span>
                                <span className="text-xs">□</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-grow">
                            {/* Project Name */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">{project.name}</h2>
                                <a
                                    href={project.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 transition-transform duration-200 hover:translate-y-[-3px]"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-black/70 leading-relaxed mb-6 flex-grow">
                                {project.description}
                            </p>

                            {/* Tech Stack */}
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {project.tech.map((tech, techIndex) => (
                                    <span
                                        key={techIndex}
                                        className="px-3 py-1.5 border-2 border-black text-xs font-medium transition-all hover:bg-black hover:text-white"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
}

export default Work;
