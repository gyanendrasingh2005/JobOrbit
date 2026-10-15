import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowRight, Sparkles, Building2, UserPlus, CheckCircle2 } from 'lucide-react'

const CtaBanner = () => {
    const navigate = useNavigate()
    const { user } = useSelector((store) => store.auth)

    return (
        <section className="py-20 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#250d4a] via-[#431B7D] to-[#6A38C2] p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
                    {/* Subtle decorative glowing shapes */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-[#F83002]/15 blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-semibold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                            <span>Accelerate Your Career Today</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                            Find Your Dream Job. <br className="hidden sm:inline" />
                            Build Your Future with Confidence.
                        </h2>

                        <p className="text-base sm:text-lg text-purple-100 max-w-2xl mx-auto leading-relaxed">
                            Join thousands of ambitious developers, designers, and managers securing top engineering and product roles on JobOrbit.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => navigate(user ? '/jobs' : '/signup')}
                                className="w-full sm:w-auto bg-white text-[#431B7D] hover:bg-gray-100 font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
                            >
                                <UserPlus className="w-4 h-4 text-purple-600" />
                                <span>{user ? 'Explore Jobs Now' : 'Create Free Candidate Account'}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => navigate(user?.role === 'recruiter' ? '/admin/jobs' : '/signup')}
                                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-medium border border-white/25 px-6 py-3.5 rounded-xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Building2 className="w-4 h-4 text-purple-200" />
                                <span>Hiring Talent? Post a Job</span>
                            </button>
                        </div>

                        {/* Trust highlights */}
                        <div className="flex items-center justify-center flex-wrap gap-6 pt-6 text-xs text-purple-200">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>100% Free for Job Seekers</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Verified Companies Only</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Direct Recruiter Review</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CtaBanner
