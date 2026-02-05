import { GraduationCap, Award, ExternalLink, Download } from "lucide-react";

function Learning() {
    // Replace with your actual resume link
    const resumeLink = "https://drive.google.com/file/d/1gQZZNC-sBPh8EG1G1N8GCzAwxJYzSI_Y/view?usp=sharing";
    const academicRecords = [
        {
            institution: "Saveetha School Of Engineering, Thandalam",
            degree: "B.E. Computer Science and Engineering",
            grade: "7.8 CGPA",
            year: "2022 – 2026 (Pursuing)"
        },
        {
            institution: "S.B.O.A. Matriculation Higher Secondary School, Anna Nagar, Chennai",
            degree: "H.S.C (Computer Science Branch)",
            grade: "73.17%",
            year: "2021 – 2022"
        },
        {
            institution: "S.B.O.A School And Junior College, Anna Nagar, Chennai",
            degree: "S.S.L.C",
            grade: "66.80%",
            year: "2019 – 2020"
        }
    ];

    const certificates = [
        {
            name: "AWS Certified Cloud Practitioner",
            issuer: "Amazon Web Services",
            description: "Trained in cloud fundamentals, security, and AWS pricing concepts.",
            link: "https://drive.google.com/file/d/175wqrGh58sc0EzAM-W3jql9nEJwjtAaR/view?usp=sharing",
            year: "2024"
        },
        {
            name: "Java Programming",
            issuer: "Great Learning Academy",
            description: "Successfully completed free online course in Java Programming.",
            link: "https://drive.google.com/file/d/1XU-tugdmqxANfVDLwM5JpFLWBFgdBkNj/view?usp=sharing",
            year: "2024"
        },
        {
            name: "Amazon Bedrock Getting Started",
            issuer: "AWS Training and Certification",
            description: "Completed training on Amazon Bedrock foundation models and AI services.",
            link: "https://drive.google.com/file/d/1cAZ6UvabBiNCPtJWSLC774lqoOD3spYi/view?usp=sharing",
            year: "2025"
        },
        {
            name: "Designing Blockchain Solutions",
            issuer: "AWS Training and Certification",
            description: "Completed training on designing blockchain solutions using Amazon Managed Blockchain.",
            link: "https://drive.google.com/file/d/1IyWzpcwLZkvdjJTHmetG1AkPAUFZCKGg/view?usp=sharing",
            year: "2025"
        }
    ];

    return (
        <section className="min-h-screen bg-[#f4f4f5] px-4 sm:px-6 md:px-16 lg:px-24 pt-24 sm:pt-28 pb-12 sm:pb-20 overflow-x-hidden">
            {/* Page Title */}
            <div className="max-w-7xl mx-auto mb-10 sm:mb-16 text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide">
                    <span className="glitch" data-text="My Learning">My Learning</span>
                </h1>
                
                {/* Download Resume Button */}
                <a
                    href={resumeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-black bg-black text-white text-[10px] sm:text-xs font-bold tracking-widest transition-all duration-300 hover:bg-white hover:text-black"
                >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    DOWNLOAD_RESUME
                </a>
            </div>

            {/* Two Column Layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                {/* Academic Records */}
                <div>
                    <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 tracking-widest">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                        EDUCATION
                    </h2>
                    <div className="space-y-4 sm:space-y-6">
                        {academicRecords.map((record, index) => (
                            <div
                                key={index}
                                className="border-2 border-black bg-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0px_4px_0px_0px_rgba(156,163,175,1)]"
                            >
                                {/* Window Header */}
                                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-black">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
                                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
                                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
                                    </div>
                                    <span className="text-[9px] sm:text-xs font-bold tracking-widest">{record.year}</span>
                                    <div className="flex items-center gap-2 text-black/40">
                                        <span className="text-[10px] sm:text-xs">—</span>
                                        <span className="text-[10px] sm:text-xs">□</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 sm:p-6">
                                    <h3 className="text-sm sm:text-base font-bold mb-1">{record.institution}</h3>
                                    <p className="text-xs sm:text-sm font-mono text-black/70 mb-1">{record.degree}</p>
                                    <p className="text-xs sm:text-sm font-semibold text-black/80">{record.grade}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Certificates */}
                <div>
                    <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 tracking-widest">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                        CERTIFICATIONS
                    </h2>
                    <div className="space-y-4 sm:space-y-6">
                        {certificates.map((cert, index) => (
                            <div
                                key={index}
                                className="border-2 border-black bg-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0px_4px_0px_0px_rgba(156,163,175,1)]"
                            >
                                {/* Window Header */}
                                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-black">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
                                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
                                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold tracking-widest">{cert.year}</span>
                                    <div className="flex items-center gap-2 text-black/40">
                                        <span className="text-[10px] sm:text-xs">—</span>
                                        <span className="text-[10px] sm:text-xs">□</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 sm:p-6">
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                        <h3 className="text-sm sm:text-base font-bold">{cert.name}</h3>
                                        <a
                                            href={cert.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 transition-transform duration-200 hover:translate-y-[-3px] flex-shrink-0"
                                        >
                                            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </a>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-black/70 mb-2">{cert.issuer}</p>
                                    <p className="text-xs sm:text-sm text-black/60">{cert.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Learning;
