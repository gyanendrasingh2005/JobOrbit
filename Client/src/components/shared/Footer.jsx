import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, ArrowUpRight, Github, Linkedin, Twitter, Mail, ShieldCheck } from 'lucide-react'

const Footer = () => {
    const navigate = useNavigate()

    return (
        <footer className="bg-white border-t border-gray-200/80 pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 5-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-gray-100">
                    {/* Brand Column (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                        <Link to="/" className="inline-block">
                            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                                Job<span className="text-[#F83002]">Orbit</span>
                            </h2>
                        </Link>

                        <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                            The premier hiring platform connecting ambitious developers, designers, and managers with verified technology teams.
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <a
                                href="https://github.com/gyanendrasingh2005"
                                target="_blank"
                                rel="noreferrer"
                                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-purple-50 text-gray-500 hover:text-purple-600 border border-gray-200/80 flex items-center justify-center transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>100% Verified Employers & Roles</span>
                        </div>
                    </div>

                    {/* Links Column 1: Candidates (2-3 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            For Job Seekers
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="/jobs" className="hover:text-purple-700 transition-colors">
                                    Explore All Jobs
                                </Link>
                            </li>
                            <li>
                                <Link to="/browse" className="hover:text-purple-700 transition-colors">
                                    Featured Positions
                                </Link>
                            </li>
                            <li>
                                <Link to="/jobs" className="hover:text-purple-700 transition-colors">
                                    Remote Engineering
                                </Link>
                            </li>
                            <li>
                                <Link to="/signup" className="hover:text-purple-700 transition-colors">
                                    Candidate Register
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links Column 2: Employers (2-3 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            For Employers
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="/admin/jobs" className="hover:text-purple-700 transition-colors">
                                    Post an Opportunity
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/companies" className="hover:text-purple-700 transition-colors">
                                    Company Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/signup" className="hover:text-purple-700 transition-colors">
                                    Recruiter Sign Up
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/jobs" className="hover:text-purple-700 transition-colors">
                                    Candidate Pipeline
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links Column 3: Top Roles (2 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Popular Roles
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="/jobs" className="hover:text-purple-700 transition-colors">
                                    Full Stack Engineers
                                </Link>
                            </li>
                            <li>
                                <Link to="/jobs" className="hover:text-purple-700 transition-colors">
                                    Cloud & AI Engineers
                                </Link>
                            </li>
                            <li>
                                <Link to="/jobs" className="hover:text-purple-700 transition-colors">
                                    Frontend Developers
                                </Link>
                            </li>
                            <li>
                                <Link to="/jobs" className="hover:text-purple-700 transition-colors">
                                    Engineering Interns
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links Column 4: Platform & Support (2 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Platform
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="/" className="hover:text-purple-700 transition-colors">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="hover:text-purple-700 transition-colors">
                                    Why Choose Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="hover:text-purple-700 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="hover:text-purple-700 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <p>© 2026 JobOrbit. All rights reserved. Built for ambitious talent.</p>

                    <div className="flex items-center gap-2 text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>All Systems Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer