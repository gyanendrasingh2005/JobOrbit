import React from 'react'
import { UserCheck, Search, Send, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const steps = [
    {
        step: '01',
        title: 'Create Your Profile',
        desc: 'Sign up in seconds, upload your resume, and highlight your technical skills and compensation expectations.',
        icon: UserCheck,
        badge: 'Quick Setup',
    },
    {
        step: '02',
        title: 'Discover Verified Roles',
        desc: 'Filter opportunities by transparent salary, location, tech stack, and company size with zero ghost jobs.',
        icon: Search,
        badge: 'Smart Filters',
    },
    {
        step: '03',
        title: 'Apply & Track in Real Time',
        desc: 'Submit your resume with a single click. Track recruiter review stages directly from your candidate dashboard.',
        icon: Send,
        badge: 'Direct Access',
    },
]

const HowItWorks = () => {
    const navigate = useNavigate()
    const { user } = useSelector((store) => store.auth)

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-3">
                        <span>Seamless Process</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                        How JobOrbit Works
                    </h2>
                    <p className="text-base text-gray-500 mt-2">
                        A modern, streamlined hiring process designed to get you interviewed and hired faster.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {steps.map((item, idx) => {
                        const Icon = item.icon
                        return (
                            <div
                                key={item.step}
                                className="relative bg-gray-50/70 hover:bg-white rounded-2xl p-7 border border-gray-200/80 hover:border-purple-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold group-hover:bg-[#6A38C2] group-hover:text-white transition-colors duration-200">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-2xl font-black text-gray-200 group-hover:text-purple-200 transition-colors">
                                            {item.step}
                                        </span>
                                    </div>

                                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium mb-2.5">
                                        {item.badge}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center gap-1 text-xs font-semibold text-purple-700">
                                    <span>Step {idx + 1} of 3</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate(user ? '/jobs' : '/signup')}
                        className="inline-flex items-center gap-2 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-medium px-6 py-3 rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer"
                    >
                        <span>{user ? 'Explore Open Roles' : 'Get Started For Free'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default HowItWorks
