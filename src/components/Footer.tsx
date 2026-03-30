import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#030508] border-t border-white/5 pt-16 pb-8 text-gray-400">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="text-2xl font-bold text-white mb-4 block">
                            CodeQuest<span className="text-teal-500">101</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            Mastering algorithms through visualization. Built for the modern developer.
                        </p>
                        <div className="flex space-x-4">
                            {[Github, Twitter, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="p-2 bg-white/5 rounded-lg hover:bg-teal-500/10 hover:text-teal-400 transition-colors">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-teal-400 transition-colors">Visualizations</Link></li>
                            <li><Link to="/chat" className="hover:text-teal-400 transition-colors">AI Tutor</Link></li>
                            <li><Link to="/about" className="hover:text-teal-400 transition-colors">About Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Resources</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Community</a></li>
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Blog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 text-center text-sm">
                    <p>© {currentYear} CodeQuest101. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;