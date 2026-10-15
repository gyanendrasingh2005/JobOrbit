import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Building2, Sparkles, MapPin } from 'lucide-react'

// Curated top hiring companies with reliable visual assets
const fallbackCompanies = [
    {
        name: 'Google',
        logo: 'https://res.cloudinary.com/dgutwhmvl/image/upload/v1791955562/ywjsqe3wzlvraa4u3bc9.jpg',
        location: 'Gurugram & Bengaluru',
        roles: 'Cloud & AI Roles',
    },
    {
        name: 'Microsoft',
        logo: 'https://res.cloudinary.com/dgutwhmvl/image/upload/v1791955244/oi0qqeoxyk9mkcns0lzw.png',
        location: 'Bengaluru & Hyderabad',
        roles: 'Solution & Core Eng',
    },
    {
        name: 'Billa Pvt Ltd',
        logo: 'https://res.cloudinary.com/dgutwhmvl/image/upload/v1791924477/rehy2nlffnvykwkxrl12.jpg',
        location: 'Ghaziabad, NCR',
        roles: 'Full Stack & Interns',
    },
    {
        name: 'Amazon',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
        location: 'Bengaluru & Pune',
        roles: 'Backend & Cloud',
    },
    {
        name: 'Adobe',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Adobe_Corporate_Horizontal_Red_HEX.svg',
        location: 'Noida & Bengaluru',
        roles: 'Frontend & UI Systems',
    },
    {
        name: 'Flipkart',
        logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Flipkart_logo.svg',
        location: 'Bengaluru',
        roles: 'Data Science & Scale',
    },
    {
        name: 'Meta',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
        location: 'Gurugram & Remote',
        roles: 'Infra & Product',
    },
]

const CompanySlider = () => {
    const navigate = useNavigate()
    const { allJobs = [] } = useSelector((store) => store.job)

    // Extract unique companies from active jobs
    const activeCompanies = useMemo(() => {
        const map = new Map()

        allJobs.forEach((job) => {
            const company = job?.company
            if (company && company.companyName && !map.has(company.companyName.toLowerCase())) {
                map.set(company.companyName.toLowerCase(), {
                    name: company.companyName,
                    logo: company.logo || null,
                    location: company.location || job.location || 'India',
                    roles: `${job.title || 'Tech'} Roles`,
                })
            }
        })

        // Merge active companies with verified fallback list
        const activeList = Array.from(map.values())
        const combined = [...activeList]

        fallbackCompanies.forEach((fb) => {
            if (!map.has(fb.name.toLowerCase())) {
                combined.push(fb)
            }
        })

        return combined
    }, [allJobs])

    // Duplicate list to create seamless infinite loop marquee
    const marqueeList = [...activeCompanies, ...activeCompanies]

    return (
        <section className="py-12 bg-white border-y border-gray-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Top Companies Hiring Now</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    Explore Opportunities at Leading Tech Teams
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-xl mx-auto">
                    Verified companies actively interviewing and hiring top developers, designers, and managers on JobOrbit.
                </p>
            </div>

            {/* Infinite Marquee Container */}
            <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <div className="animate-marquee flex items-center gap-4 py-2">
                    {marqueeList.map((comp, idx) => (
                        <div
                            key={`${comp.name}-${idx}`}
                            onClick={() => navigate(`/jobs`)}
                            className="flex items-center gap-3.5 px-4 py-3 bg-gray-50/80 hover:bg-white rounded-xl border border-gray-200/80 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer min-w-[240px] select-none group"
                        >
                            <div className="w-11 h-11 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                                {comp.logo ? (
                                    <img
                                        src={comp.logo}
                                        alt={comp.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                            e.target.nextSibling.style.display = 'flex'
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-full h-full bg-purple-50 text-purple-700 font-bold text-sm items-center justify-center rounded ${
                                        comp.logo ? 'hidden' : 'flex'
                                    }`}
                                >
                                    {comp.name.slice(0, 2).toUpperCase()}
                                </div>
                            </div>

                            <div className="overflow-hidden">
                                <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                                    {comp.name}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                                    <span className="truncate">{comp.location}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default CompanySlider
