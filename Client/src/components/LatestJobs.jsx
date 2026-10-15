import React, { useState } from 'react'
import LatestJobCards from './LatestJobCards'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Briefcase, Filter } from 'lucide-react'

function LatestJobs() {
    const navigate = useNavigate()
    const { allJobs = [] } = useSelector((state) => state.job)
    const [selectedFilter, setSelectedFilter] = useState('All')

    // Filter tags for quick toggle on landing page
    const filterTags = ['All', 'Full Stack', 'Cloud', 'Engineering']

    const filteredJobs = allJobs.filter((job) => {
        if (selectedFilter === 'All') return true
        const text = `${job?.title || ''} ${job?.description || ''}`.toLowerCase()
        return text.includes(selectedFilter.toLowerCase())
    })

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#F83002]" />
                            <span>Featured Opportunities</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                            Latest & Top Job Openings
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-xl">
                            Verified positions with transparent compensation and direct recruiter visibility.
                        </p>
                    </div>

                    {/* Quick filter pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {filterTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setSelectedFilter(tag)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    selectedFilter === tag
                                        ? 'bg-[#6A38C2] text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Job Cards Grid */}
                {filteredJobs.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-200/80">
                        <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800 mb-1">No matching featured jobs</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                            Check back soon or explore our complete job catalogue with custom search criteria.
                        </p>
                        <button
                            onClick={() => setSelectedFilter('All')}
                            className="text-xs font-semibold text-purple-700 hover:underline cursor-pointer"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        {filteredJobs.slice(0, 6).map((job) => (
                            <div key={job._id} className="h-full">
                                <LatestJobCards job={job} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom View All CTA */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate('/jobs')}
                        className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-purple-700 font-semibold px-6 py-3 rounded-xl border border-purple-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                    >
                        <span>Explore All {allJobs.length > 0 ? `${allJobs.length}+` : ''} Open Positions</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default LatestJobs