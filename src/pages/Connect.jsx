import { CheckCircle } from "lucide-react";
import { useState } from "react";

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

function Connect() {
    const myEmail = "rmohammedbasil83@gmail.com";
    const whatsappNumber = "916383029537";
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("https://portfolio-api-kean.onrender.com/api/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setShowSuccess(true);
                setFormData({ name: "", email: "", message: "" });
            } else {
                alert("Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to send message. Make sure the server is running.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="min-h-screen bg-[#f4f4f5] px-4 sm:px-6 md:px-16 lg:px-24 pt-24 sm:pt-28 pb-12 sm:pb-20 overflow-x-hidden">
            {/* Page Title */}
            <div className="max-w-7xl mx-auto mb-10 sm:mb-16 text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide">
                    <span className="glitch" data-text="OPEN_CHANNEL">OPEN_CHANNEL</span>
                </h1>
            </div>

            {/* Contact Form Card */}
            <div className="max-w-2xl mx-auto">
                <div className="border-2 border-black bg-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0px_4px_0px_0px_rgba(156,163,175,1)]">
                    {/* Window Header */}
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-black">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
                        </div>
                        <div className="flex items-center gap-2 text-black/40">
                            <span className="text-[10px] sm:text-xs">—</span>
                            <span className="text-[10px] sm:text-xs">□</span>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-4 sm:p-6 md:p-8">
                        {/* Email Display */}
                        <div className="text-center mb-6 sm:mb-8">
                            <span className="text-xs sm:text-sm text-black/60 block sm:inline">Transmitting data to: </span>
                            <span className="font-mono text-[10px] sm:text-sm border border-black/20 px-2 sm:px-3 py-1 mt-1 sm:mt-0 inline-block break-all">{myEmail}</span>
                        </div>

                        {/* Success Message Box */}
                        {showSuccess && (
                            <div className="border-2 border-black mb-6 sm:mb-8">
                                {/* Success Box Header */}
                                <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b-2 border-black bg-white">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500"></span>
                                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-500"></span>
                                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500"></span>
                                    </div>
                                    <span className="text-[9px] sm:text-xs font-bold tracking-widest">TRANSMISSION_STATUS</span>
                                    <div className="flex items-center gap-2 text-black/40">
                                        <span className="text-[10px] sm:text-xs">—</span>
                                        <span className="text-[10px] sm:text-xs">□</span>
                                    </div>
                                </div>
                                {/* Success Content */}
                                <div className="px-3 sm:px-4 py-6 sm:py-8 bg-white">
                                    <p className="text-[10px] sm:text-xs font-medium text-green-600">
                                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 inline mr-1 sm:mr-1.5" />
                                        TRANSMISSION SUCCESSFUL! Your message has been received. I will get back to you soon.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {/* Name and Email Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold tracking-widest mb-2">
                                        USER_ID
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-black bg-[#f4f4f5] outline-none transition-colors text-xs sm:text-sm font-mono"
                                        placeholder="Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] sm:text-xs font-bold tracking-widest mb-2">
                                        RETURN_PATH
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-black bg-[#f4f4f5] outline-none transition-colors text-xs sm:text-sm font-mono"
                                        placeholder="Email"
                                    />
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold tracking-widest mb-2">
                                    DATA_PACKET
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={5}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-black bg-[#f4f4f5] outline-none transition-colors text-xs sm:text-sm font-mono resize-none"
                                    placeholder="Type your message..."
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black text-white py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-widest hover:bg-black/80 transition-colors disabled:bg-black/50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "TRANSMITTING..." : "TRANSMIT_MESSAGE"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* WhatsApp Option */}
                <div className="mt-6 sm:mt-8">
                    <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 sm:gap-3 border-2 border-black bg-white px-4 sm:px-6 py-3 sm:py-4 font-bold tracking-widest text-xs sm:text-sm transition-all duration-300 hover:bg-black hover:text-white hover:translate-y-[-4px] hover:shadow-[0px_4px_0px_0px_rgba(156,163,175,1)]"
                    >
                        <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        CONNECT_VIA_WHATSAPP
                    </a>
                </div>
            </div>
        </section>
    );
}

export default Connect;
