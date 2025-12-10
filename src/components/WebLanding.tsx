import React, { useState, useEffect } from 'react';
import {
    Sprout, Wifi, Battery, Search, Plus, Droplet, Sun,
    Home, ScanLine, Stethoscope, MessageCircle, Play,
    CheckCircle, Bell, Scan, Clock, Trophy, CloudRain
} from 'lucide-react';

interface WebLandingProps {
    onLogin: () => void;
}

const WebLanding: React.FC<WebLandingProps> = ({ onLogin }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- SUB-COMPONENTS ---

    const Navbar = () => (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center text-white">
                        <Sprout size={18} />
                    </div>
                    <span className="font-bold text-xl text-gray-900 tracking-tight">Seedly Grow</span>
                </div>

                <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
                    <a href="#features" className="hover:text-lime-600 transition-colors">Features</a>
                    <a href="#gallery" className="hover:text-lime-600 transition-colors">Screenshots</a>
                    <a href="#how-it-works" className="hover:text-lime-600 transition-colors">How it Works</a>
                </div>

                <button
                    onClick={onLogin}
                    className="bg-brand-dark hover:bg-lime-600 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                    <span>Sign In</span>
                </button>
            </div>
        </nav>
    );

    const AppMockup = () => (
        <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col overflow-hidden">
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#F3F4F6] relative flex flex-col">
                {/* Status Bar */}
                <div className="h-8 bg-white flex justify-between items-center px-6 text-[10px] font-bold text-gray-800 flex-shrink-0">
                    <span>10:23</span>
                    <div className="flex gap-1">
                        <Wifi size={12} />
                        <Battery size={12} />
                    </div>
                </div>

                {/* Mock App Content */}
                <div className="p-5 flex-1 overflow-y-hidden relative">
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-4">My Garden</h1>

                    <div className="relative mb-4">
                        <div className="absolute left-4 top-3.5 text-gray-400">
                            <Search size={18} />
                        </div>
                        <div className="w-full bg-white h-12 rounded-2xl pl-11 pr-4 flex items-center text-sm text-gray-400 shadow-sm">
                            Search plants...
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-[4/5] rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-bold text-gray-500">Add Plant</span>
                        </div>
                        <div className="aspect-[4/5] bg-white rounded-3xl p-3 shadow-sm border border-gray-100 flex flex-col relative">
                            <div className="w-full h-28 rounded-2xl bg-green-100 mb-3 overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover" alt="Plant" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight mb-0.5">Money Plant</h3>
                            <div className="mt-auto flex gap-2">
                                <div className="bg-blue-50 p-1 rounded-lg"><Droplet size={10} className="text-blue-500" /></div>
                                <div className="bg-amber-50 p-1 rounded-lg"><Sun size={10} className="text-amber-500" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mock Navbar */}
                <div className="absolute bottom-4 left-4 right-4 h-16 bg-white/90 backdrop-blur-md rounded-3xl shadow-lg flex justify-around items-center px-2 z-20">
                    <Home size={20} className="text-gray-400" />
                    <Sprout size={20} className="text-lime-600" />
                    <div className="w-12 h-12 bg-lime-500 rounded-full flex items-center justify-center text-white -mt-6 border-4 border-[#F3F4F6]">
                        <ScanLine size={20} />
                    </div>
                    <Stethoscope size={20} className="text-gray-400" />
                    <MessageCircle size={20} className="text-gray-400" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] text-gray-800 font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-200 rounded-full blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-200 rounded-full blur-[120px] opacity-20 -translate-x-1/2 translate-y-1/3"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 text-center md:text-left space-y-8 animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-100 border border-lime-200 shadow-sm text-lime-800 font-bold text-xs uppercase tracking-wider mb-2">
                                <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
                                Now Available on Web
                            </div>

                            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight">
                                Grow Thriving Plants with <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-emerald-600">AI Confidence</span>
                            </h1>

                            <p className="text-xl text-gray-600 leading-relaxed max-w-xl mx-auto md:mx-0">
                                Identify plants instantly, diagnose diseases with "Dr. Plant", and manage your garden from any device.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                    onClick={onLogin}
                                    className="bg-brand-dark text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-lime-600 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Play size={20} className="fill-current" />
                                    Launch Web App
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 w-full flex justify-center md:justify-end animate-float">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-lime-400 to-emerald-500 rounded-[3rem] opacity-20 blur-xl"></div>
                                <AppMockup />

                                {/* Floating Cards */}
                                <div className="absolute top-20 -left-12 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                                    <div className="bg-lime-100 p-2 rounded-lg text-lime-600"><CheckCircle size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold">Status</p>
                                        <p className="text-sm font-bold text-gray-800">Plant Identified!</p>
                                    </div>
                                </div>

                                <div className="absolute bottom-32 -right-8 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Bell size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold">Reminder</p>
                                        <p className="text-sm font-bold text-gray-800">Water Peace Lily</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to grow</h2>
                        <p className="text-gray-600 text-lg">Seedly Grow combines advanced AI with local weather data to ensure your plants don't just survive, they thrive.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Scan, title: 'Instant ID', desc: 'Identify plants instantly with high accuracy.', color: 'bg-lime-100 text-lime-600' },
                            { icon: Stethoscope, title: 'Dr. Plant', desc: 'AI diagnosis for pests and diseases.', color: 'bg-red-100 text-red-500' },
                            { icon: CloudRain, title: 'Smart Care', desc: 'Weather-aware watering schedules.', color: 'bg-blue-100 text-blue-500' },
                            { icon: Trophy, title: 'Gamification', desc: 'Earn XP and unlock achievements.', color: 'bg-yellow-100 text-yellow-600' }
                        ].map((feature, i) => (
                            <div key={i} className="bg-gray-50 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center text-white">
                            <Sprout size={18} />
                        </div>
                        <span className="font-bold text-xl text-gray-900">Seedly Grow</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} Seedly Grow. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default WebLanding;