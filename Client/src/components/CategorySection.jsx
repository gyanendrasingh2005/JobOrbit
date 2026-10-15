import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setJobFilter, setSearchedQuery } from '@/redux/jobSlice'
import {
    Code2,
    Cloud,
    BrainCircuit,
    Layers,
    Briefcase,
    Palette,
    GraduationCap,
    ShieldCheck,
    ArrowRight,
} from 'lucide-react'

const categories = [
    {
        id: 'fullstack',
        name: 'Full Stack Development',
        filterKey: 'industry',
        filterValue: 'Full Stack Developer',
        icon: Layers,
        color: 'text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
        desc: 'Frontend, Backend, and end-to-end architectures',
    },
    {
        id: 'software',
        name: 'Frontend & UI Engineering',
        filterKey: 'industry',
        filterValue: 'Frontend Developer',
        icon: Code2,
        color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white',
        desc: 'React, Vue, Design Systems, and modern web apps',
    },
    {
        id: 'backend',
        name: 'Backend & Distributed Systems',
        filterKey: 'industry',
        filterValue: 'Backend Developer',
        icon: Code2,
        color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
        desc: 'Node.js, Python, Go, APIs, and microservices',
    },
    {
        id: 'cloud',
        name: 'Cloud & DevOps Infrastructure',
        filterKey: 'industry',
        filterValue: 'Cloud & DevOps',
        icon: Cloud,
        color: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
        desc: 'AWS, Azure, Docker, Kubernetes, CI/CD pipelines',
    },
    {
        id: 'data',
        name: 'Data Science & Artificial Intelligence',
        filterKey: 'industry',
        filterValue: 'Data Science / AI',
        icon: BrainCircuit,
        color: 'text-rose-600 bg-rose-50 group-hover:bg-rose-600 group-hover:text-white',
        desc: 'Machine Learning, LLMs, Deep Learning, Analytics',
    },
    {
        id: 'design',
        name: 'Product & UI/UX Design',
        filterKey: 'industry',
        filterValue: 'Design',
        icon: Palette,
        color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white',
        desc: 'User research, wireframing, Figma design systems',
    },
    {
        id: 'intern',
        name: 'Internships & Early Career',
        filterKey: 'jobType',
        filterValue: 'Internship',
        icon: GraduationCap,
        color: 'text-teal-600 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white',
        desc: 'College internships, fresh graduate entry roles',
    },
    {
        id: 'product',
        name: 'Product & Project Management',
        filterKey: 'industry',
        filterValue: 'Product',
        icon: Briefcase,
        color: 'text-orange-600 bg-orange-50 group-hover:bg-orange-600 group-hover:text-white',
        desc: 'Agile sprints, roadmap strategy, delivery',
    },
]

const CategorySection = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { allJobs = [] } = useSelector((store) => store.job)

    // Calculate count of live jobs for each category
    const getJobCount = (cat) => {
        if (!Array.isArray(allJobs) || allJobs.length === 0) return 'Open roles'
        const count = allJobs.filter((job) => {
            const title = (job?.title || '').toLowerCase()
            const desc = (job?.description || '').toLowerCase()
            const type = (job?.jobType || '').toLowerCase()
            const text = `${title} ${desc} ${type}`

            if (cat.id === 'fullstack') return text.includes('full stack') || text.includes('fullstack')
            if (cat.id === 'software') return text.includes('frontend') || text.includes('react') || text.includes('ui')
            if (cat.id === 'backend') return text.includes('backend') || text.includes('node') || text.includes('api')
            if (cat.id === 'cloud') return text.includes('cloud') || text.includes('devops') || text.includes('solution')
            if (cat.id === 'data') return text.includes('data') || text.includes('ai') || text.includes('learning')
            if (cat.id === 'design') return text.includes('design') || text.includes('ui/ux')
            if (cat.id === 'intern') return text.includes('intern') || type.includes('intern')
            return text.includes(cat.name.toLowerCase())
        }).length

        return count > 0 ? `${count} open ${count === 1 ? 'position' : 'positions'}` : 'Explore roles'
    }

    const handleCategoryClick = (cat) => {
        if (cat.filterKey === 'jobType') {
            dispatch(setJobFilter({ key: 'jobType', value: cat.filterValue }))
        } else {
            dispatch(setJobFilter({ key: 'industry', value: cat.filterValue }))
        }
        navigate('/jobs')
    }

    return (
        <section className="py-16 bg-gray-50/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2">
                            <span>Specialized Disciplines</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            Browse Jobs by Category
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-xl">
                            Find opportunities tailored to your core technical focus and career goals.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/jobs')}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-800 transition-colors group cursor-pointer"
                    >
                        <span>View all categories</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {categories.map((cat) => {
                        const Icon = cat.icon
                        const jobCountText = getJobCount(cat)

                        return (
                            <div
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className="group bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${cat.color}`}
                                        >
                                            <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">
                                            {jobCountText}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-base text-gray-900 group-hover:text-purple-700 transition-colors mb-1.5">
                                        {cat.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                        {cat.desc}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-purple-600 group-hover:text-purple-700">
                                    <span>Browse jobs</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default CategorySection
