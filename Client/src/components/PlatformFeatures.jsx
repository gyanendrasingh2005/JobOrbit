import React from 'react'
import { ShieldCheck, IndianRupee, Zap, Activity, CheckCircle2 } from 'lucide-react'

const features = [
    {
        title: '100% Verified Companies',
        desc: 'Every company profile and job posting is authenticated by recruiters, keeping you safe from ghost listings.',
        icon: ShieldCheck,
        highlight: 'Zero Spam',
    },
    {
        title: 'Upfront Salary Transparency',
        desc: 'Know compensation packages before investing your time. Every job includes clearly posted salary ranges.',
        icon: IndianRupee,
        highlight: 'Honest Pay',
    },
    {
        title: 'Real-Time Status Pipeline',
        desc: 'Say goodbye to the application black hole. Get notified the moment a recruiter reviews or updates your candidacy.',
        icon: Activity,
        highlight: 'Instant Updates',
    },
    {
        title: 'Direct Recruiter Visibility',
        desc: 'Your profile goes directly to hiring managers with formatted resumes and verified contact credentials.',
        icon: Zap,
        highlight: 'Priority Review',
    },
]

const PlatformFeatures = () => {
    return (
        <section className="py-20 bg-gray-50/50 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column: Mission statement */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider">
                            <span>Why JobOrbit?</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                            Built for ambitious talent and modern engineering teams.
                        </h2>

                        <p className="text-base text-gray-600 leading-relaxed">
                            Traditional job portals are cluttered with stale postings, spam recruiters, and opaque salary bands. JobOrbit was designed from the ground up to give candidates direct access, verified insights, and real momentum.
                        </p>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>Free for all candidate job seekers forever</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>Direct recruiter dashboards for fast hiring</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>Comprehensive search by tech stack and location</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: 4 Key Feature Cards */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {features.map((feat) => {
                            const Icon = feat.icon
                            return (
                                <div
                                    key={feat.title}
                                    className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                                                {feat.highlight}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-gray-900 mb-2">
                                            {feat.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {feat.desc}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PlatformFeatures
