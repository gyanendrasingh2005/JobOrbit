import React from 'react'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import { MapPin, Building2, Bookmark, CheckCircle2, ArrowRight } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { setBookmarks } from '@/redux/authSlice'
import { toast } from 'sonner'

function LatestJobCards({ job }) {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { user } = useSelector(store => store.auth)

    const isBookmarked = user?.bookmarks?.some(
        (id) => (typeof id === 'string' ? id : id?._id) === job?._id
    ) || false

    const bookmarkHandler = async (e) => {
        e.stopPropagation()
        if (!user) {
            toast.error("Please login to save jobs")
            navigate("/login")
            return
        }
        try {
            const response = await axios.post(`${USER_API_END_POINT}/bookmark/${job?._id}`, {}, {
                withCredentials: true,
            })
            if (response.data.success) {
                dispatch(setBookmarks(response.data.bookmarks))
                if (response.data.isBookmarked) {
                    toast.success("Job saved for later ⭐")
                } else {
                    toast.success("Job removed from bookmarks")
                }
            }
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Something went wrong")
        }
    }

    const calculateDaysAgo = (mongodbTime) => {
        if (!mongodbTime) return 'Recently'
        const createdAt = new Date(mongodbTime)
        const currentDate = new Date()
        const diffInDays = Math.floor((currentDate - createdAt) / (1000 * 3600 * 24))
        if (diffInDays === 0) return 'Today'
        if (diffInDays === 1) return 'Yesterday'
        return `${diffInDays}d ago`
    }

    return (
        <div
            onClick={() => navigate(`/description/${job?._id}`)}
            className="group bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-purple-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer relative"
        >
            {/* Top row: Company, Location, Posted Time */}
            <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                            {job?.company?.logo ? (
                                <img
                                    src={job.company.logo}
                                    alt={job?.company?.companyName || 'Company'}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                    }}
                                />
                            ) : (
                                <Building2 className="w-6 h-6 text-purple-600" />
                            )}
                        </div>

                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1">
                                <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                    {job?.company?.companyName || 'Verified Partner'}
                                </h4>
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate">{job?.location || 'India / Remote'}</span>
                            </div>
                        </div>
                    </div>

                    <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md shrink-0">
                        {calculateDaysAgo(job?.createdAt)}
                    </span>
                </div>

                {/* Role Title */}
                <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-purple-700 transition-colors mb-2 line-clamp-1">
                    {job?.title}
                </h3>

                {/* Description snippet */}
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {job?.description || 'Explore this opportunity and apply directly with your resume.'}
                </p>
            </div>

            {/* Bottom Section: Badges & CTA */}
            <div>
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap pt-2 pb-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                        {job?.salary ? `${job.salary} LPA` : 'Competitive'}
                    </span>
                    <span className="text-xs font-semibold text-[#F83002] bg-orange-50 px-2.5 py-1 rounded-lg">
                        {job?.jobType || 'Full Time'}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {job?.position ? `${job.position} Openings` : 'Open'}
                    </span>
                </div>

                {/* Card Footer Buttons */}
                <div className="flex items-center justify-between pt-1 text-xs font-semibold">
                    <span className="text-purple-700 group-hover:underline flex items-center gap-1">
                        View Details
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <button
                        type="button"
                        onClick={bookmarkHandler}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isBookmarked
                                ? "text-purple-700 bg-purple-50 hover:bg-purple-100"
                                : "text-gray-400 hover:text-purple-700 hover:bg-purple-50"
                        }`}
                        title={isBookmarked ? "Remove from saved" : "Save Job"}
                    >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-purple-700 text-purple-700" : ""}`} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LatestJobCards