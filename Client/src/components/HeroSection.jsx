import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setSearchedQuery, setJobFilter } from '@/redux/jobSlice'
import {
    Search,
    MapPin,
    ArrowRight,
    Sparkles,
    Briefcase,
    Building2,
    CheckCircle2,
    TrendingUp,
    ShieldCheck,
    Zap,
} from 'lucide-react'

function HeroSection() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { allJobs = [] } = useSelector((store) => store.job)
    const { user } = useSelector((store) => store.auth)

    const [keyword, setKeyword] = useState('')
    const [location, setLocation] = useState('')

    // Featured preview job from real jobs data
    const previewJob = allJobs.length > 0 ? allJobs[0] : null

    const handleSearch = (e) => {
        e?.preventDefault()
        if (keyword.trim()) {
            dispatch(setSearchedQuery(keyword.trim()))
        }
        if (location.trim()) {
            dispatch(setJobFilter({ key: 'location', value: location.trim() }))
        }
        navigate('/jobs')
    }

    const handleQuickTagClick = (tag, type = 'query') => {
        if (type === 'location') {
            dispatch(setJobFilter({ key: 'location', value: tag }))
        } else {
            dispatch(setSearchedQuery(tag))
        }
        navigate('/jobs')
    }

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-purple-50/60 via-white to-white pt-8 pb-16 lg:py-20 border-b border-gray-100">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-purple-200/30 via-[#F83002]/10 to-purple-200/30 blur-3xl -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    {/* Left Column: Copy & Search */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        {/* Eyebrow badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-semibold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                            <span>The Modern Career Platform • 500+ Verified Roles</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                            Find Your Dream Job. <br />
                            <span className="bg-gradient-to-r from-[#6A38C2] to-[#8d4fe6] bg-clip-text text-transparent">
                                Build Your Future.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Connect with leading companies and discover verified opportunities across engineering, product, AI, and design with full salary transparency.
                        </p>

                        {/* Dual-Field Search Container */}
                        <form
                            onSubmit={handleSearch}
                            className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl border border-gray-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl mx-auto lg:mx-0 focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100 transition-all"
                        >
                            {/* Input 1: Keyword */}
                            <div className="flex-1 flex items-center gap-2.5 px-3 py-2">
                                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Job title, skill, or company..."
                                    className="w-full text-sm outline-none text-gray-900 placeholder:text-gray-400 bg-transparent font-normal"
                                />
                            </div>

                            {/* Divider for desktop */}
                            <div className="hidden sm:block w-px h-8 bg-gray-200 shrink-0" />

                            {/* Input 2: Location */}
                            <div className="flex-1 flex items-center gap-2.5 px-3 py-2 border-t sm:border-t-0 border-gray-100">
                                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="City (e.g. Bengaluru, Remote)..."
                                    className="w-full text-sm outline-none text-gray-900 placeholder:text-gray-400 bg-transparent font-normal"
                                />
                            </div>

                            {/* Search Submit Button */}
                            <button
                                type="submit"
                                className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold px-7 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition-all cursor-pointer shrink-0"
                            >
                                <Search className="w-4 h-4" />
                                <span>Find Jobs</span>
                            </button>
                        </form>

                        {/* Popular Search Tags */}
                        <div className="flex items-center justify-center lg:justify-start flex-wrap gap-2 pt-1 text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">Popular:</span>
                            {['Full Stack', 'Cloud AI', 'Remote', 'Bengaluru', 'Internship'].map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleQuickTagClick(tag, tag === 'Remote' || tag === 'Bengaluru' ? 'location' : 'query')}
                                    className="bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Secondary CTAs */}
                        <div className="flex items-center justify-center lg:justify-start gap-5 pt-3 text-sm">
                            <button
                                onClick={() => navigate('/jobs')}
                                className="font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1.5 group cursor-pointer"
                            >
                                <span>Explore all open positions</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <span className="text-gray-300">•</span>

                            <button
                                onClick={() => navigate(user?.role === 'recruiter' ? '/admin/jobs' : '/signup')}
                                className="font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
                            >
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>Hiring? Post a Job</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Hero Visual Card Showcase */}
                    <div className="lg:col-span-5 relative">
                        {/* Decorative background glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-[#F83002] rounded-3xl blur-xl opacity-20 -z-10" />

                        {/* Main Featured Showcase Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-2xl relative space-y-6">
                            {/* Live recruiting header badge */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                        Actively Interviewing
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-gray-400">Featured Role</span>
                            </div>

                            {/* Job Info */}
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 p-2 overflow-hidden shadow-xs">
                                    {previewJob?.company?.logo ? (
                                        <img
                                            src={previewJob.company.logo}
                                            alt="Company"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="w-7 h-7 text-purple-600" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">
                                            {previewJob?.company?.companyName || 'Google'}
                                        </h4>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 truncate mt-0.5">
                                        {previewJob?.title || 'Cloud AI Engineer'}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span>{previewJob?.location || 'Gurugram & Bengaluru'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Badges / Compensation */}
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs">
                                    {previewJob?.salary || '44'} LPA
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#F83002] font-semibold text-xs">
                                    {previewJob?.jobType || 'Full Time'}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs">
                                    {previewJob?.position || '23'} Openings
                                </span>
                            </div>

                            {/* Recruiter & Candidate Status */}
                            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-600" />
                                    <span className="font-semibold text-gray-700">1-Click Fast Apply</span>
                                </div>
                                <span className="text-emerald-600 font-semibold">⚡ Verified Direct Post</span>
                            </div>

                            {/* View Job CTA */}
                            <button
                                onClick={() => navigate(previewJob ? `/description/${previewJob._id}` : '/jobs')}
                                className="w-full bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>View Opportunity Details</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Floating trust badge (Bottom left) */}
                        <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-900">Verified Recruiters</div>
                                <div className="text-[11px] text-gray-500">100% scam-free guarantee</div>
                            </div>
                        </div>

                        {/* Floating metric badge (Top right) */}
                        <div className="absolute -top-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2.5">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold text-gray-800">48h Avg Response</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection