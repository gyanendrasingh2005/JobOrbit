import React, { useEffect, useMemo, useState } from 'react'
import Navbar from './shared/Navbar'
import Footer from './shared/Footer'
import FilterCard from './FilterCard'
import Job from './Job'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { setSearchedQuery, setJobFilter, clearAllFilters } from '@/redux/jobSlice'
import {
    matchIndustry,
    matchJobType,
    matchKeyword,
    matchLocation,
    matchSalary,
} from '@/utils/filterUtils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Search, SlidersHorizontal, X, RotateCcw, Briefcase } from 'lucide-react'

function Jobs() {
    const dispatch = useDispatch()
    useGetAllJobs()

    const { allJobs = [], searchedQuery = '', filters = {} } = useSelector(
        (state) => state.job
    )

    const [isFilterBoxOpen, setIsFilterBoxOpen] = useState(false)
    const [searchInput, setSearchInput] = useState(searchedQuery || '')

    // Keep local search input synced with searchedQuery if changed externally
    useEffect(() => {
        setSearchInput(searchedQuery || '')
    }, [searchedQuery])

    // Clean up filters when unmounting
    useEffect(() => {
        return () => {
            dispatch(clearAllFilters())
        }
    }, [dispatch])

    // Compute filtered jobs
    const filterJobs = useMemo(() => {
        if (!Array.isArray(allJobs)) return []

        return allJobs.filter((job) => {
            const matchesLoc = matchLocation(job?.location, filters?.location)
            const matchesInd = matchIndustry(job, filters?.industry)
            const matchesSal = matchSalary(job?.salary, filters?.salary)
            const matchesType = matchJobType(job?.jobType, filters?.jobType)
            const matchesKw = matchKeyword(job, searchedQuery)

            return matchesLoc && matchesInd && matchesSal && matchesType && matchesKw
        })
    }, [allJobs, filters, searchedQuery])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        dispatch(setSearchedQuery(searchInput.trim()))
    }

    const handleClearSearch = () => {
        setSearchInput('')
        dispatch(setSearchedQuery(''))
    }

    const activeFilterList = useMemo(() => {
        const list = []
        if (filters?.location) {
            list.push({ key: 'location', label: `Location: ${filters.location}` })
        }
        if (filters?.industry) {
            list.push({ key: 'industry', label: `Role: ${filters.industry}` })
        }
        if (filters?.salary) {
            list.push({ key: 'salary', label: `Salary: ${filters.salary}` })
        }
        if (filters?.jobType) {
            list.push({ key: 'jobType', label: `Type: ${filters.jobType}` })
        }
        if (searchedQuery) {
            list.push({ key: 'search', label: `Keyword: "${searchedQuery}"` })
        }
        return list
    }, [filters, searchedQuery])

    const handleRemoveTag = (item) => {
        if (item.key === 'search') {
            handleClearSearch()
        } else {
            dispatch(setJobFilter({ key: item.key, value: '' }))
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Search Bar & Header Area */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-xs border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                Explore Opportunities
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Discover jobs tailored to your skills, preferred location, and salary expectations.
                            </p>
                        </div>

                        {/* Search Input */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex items-center gap-2 w-full md:w-96"
                        >
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search by role, company, or keyword..."
                                    className="pl-9 pr-8 h-10 text-sm rounded-lg"
                                />
                                {searchInput && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white h-10 px-4 cursor-pointer">
                                Search
                            </Button>
                        </form>
                    </div>

                    {/* Active Filter Pills Bar */}
                    {activeFilterList.length > 0 && (
                        <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">
                                Active Filters:
                            </span>
                            {activeFilterList.map((item) => (
                                <Badge
                                    key={item.key}
                                    variant="secondary"
                                    className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors py-1 px-2.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                                    onClick={() => handleRemoveTag(item)}
                                >
                                    <span>{item.label}</span>
                                    <X className="w-3 h-3 hover:text-purple-900" />
                                </Badge>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dispatch(clearAllFilters())}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-6 px-2 font-medium flex items-center gap-1 ml-auto cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset All
                            </Button>
                        </div>
                    )}
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block lg:col-span-1 sticky top-6">
                        <FilterCard />
                    </aside>

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden col-span-1">
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterBoxOpen(!isFilterBoxOpen)}
                            className="w-full flex items-center justify-center gap-2 bg-white"
                        >
                            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                            <span>{isFilterBoxOpen ? 'Hide Filters' : 'Show Filters'}</span>
                            {activeFilterList.length > 0 && (
                                <Badge className="bg-purple-600 text-white ml-1 text-xs">
                                    {activeFilterList.length}
                                </Badge>
                            )}
                        </Button>

                        {isFilterBoxOpen && (
                            <div className="mt-3">
                                <FilterCard />
                            </div>
                        )}
                    </div>

                    {/* Job Cards Grid */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-gray-600">
                                Showing <span className="font-bold text-gray-900">{filterJobs.length}</span> {filterJobs.length === 1 ? 'job' : 'jobs'}
                            </p>
                        </div>

                        {filterJobs.length <= 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
                                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    No matching jobs found
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                                    We couldn't find any positions matching your selected criteria. Try adjusting your filters or clearing them to see all open positions.
                                </p>
                                <Button
                                    onClick={() => dispatch(clearAllFilters())}
                                    className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset All Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                                <AnimatePresence>
                                    {filterJobs.map((job) => (
                                        <motion.div
                                            key={job._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="h-full"
                                        >
                                            <Job job={job} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Jobs