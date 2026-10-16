import React, { useEffect, useState } from 'react'
import Navbar from './shared/Navbar'
import Footer from './shared/Footer'
import AppliedJobTable from './AppliedJobTable'
import ApplicationTimelineDialog from './ApplicationTimelineDialog'
import { useSelector, useDispatch } from 'react-redux'
import { setAllAppliedJobs } from '@/redux/jobSlice'
import axios from 'axios'
import { APPLICANT_API_END_POINT, INTERVIEW_API_END_POINT } from '@/utils/constant'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Clock,
  CheckCircle,
  Calendar,
  XCircle,
  FileCheck2,
  Video,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

const SeekerDashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector(store => store.auth)
  const { allAppliedJobs } = useSelector(store => store.job)

  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState([])
  const [activeTab, setActiveTab] = useState('applications') // 'applications' | 'interviews'
  const [stats, setStats] = useState({
    totalApplications: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    selected: 0,
    rejected: 0,
    upcomingInterviews: 0,
  })

  const [selectedApp, setSelectedApp] = useState(null)
  const [timelineOpen, setTimelineOpen] = useState(false)

  // Fetch applied jobs and interviews
  const fetchData = async () => {
    setLoading(true)
    try {
      const [appRes, interviewRes, statsRes] = await Promise.allSettled([
        axios.get(`${APPLICANT_API_END_POINT}/get`, { withCredentials: true }),
        axios.get(`${INTERVIEW_API_END_POINT}/my-interviews?filter=upcoming`, { withCredentials: true }),
        axios.get(`${APPLICANT_API_END_POINT}/seeker/stats`, { withCredentials: true }),
      ])

      if (appRes.status === 'fulfilled' && appRes.value.data.success) {
        dispatch(setAllAppliedJobs(appRes.value.data.application))
      }

      if (interviewRes.status === 'fulfilled' && interviewRes.value.data.success) {
        setInterviews(interviewRes.value.data.interviews || [])
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.totalApplications || allAppliedJobs?.length || 0,
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Under Review',
      value: stats.underReview || 0,
      icon: Clock,
      color: 'from-sky-500 to-cyan-600',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
    },
    {
      label: 'Shortlisted',
      value: stats.shortlisted || 0,
      icon: FileCheck2,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: 'Upcoming Interviews',
      value: stats.upcomingInterviews || interviews?.length || 0,
      icon: Calendar,
      color: 'from-purple-500 to-fuchsia-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      label: 'Offers / Selected',
      value: stats.selected || 0,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Rejected',
      value: stats.rejected || 0,
      icon: XCircle,
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
    },
  ]

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100/70 px-3 py-1 rounded-full">
                  Job Seeker Workspace
                </span>
                <span className="text-xs text-gray-500">Live Status Tracking</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
                Welcome back, {user?.fullname?.split(' ')[0] || 'Seeker'}! 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Monitor your job applications, recruitment stages, and interview calendar in one place.
              </p>
            </div>

            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200 hover:border-purple-300 hover:text-purple-700 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 truncate">{stat.label}</span>
                    <div className={`w-7 h-7 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${stat.textColor}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {stat.value}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Dashboard Tabs & Content */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'applications'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>My Applications</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'applications'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {allAppliedJobs?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('interviews')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'interviews'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming Interviews</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'interviews'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {interviews?.length || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab 1: Applications */}
            {activeTab === 'applications' && <AppliedJobTable />}

            {/* Tab 2: Upcoming Interviews */}
            {activeTab === 'interviews' && (
              <div>
                {interviews.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
                    <h3 className="text-base font-bold text-gray-800">No Upcoming Interviews</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      When a recruiter reviews your application and schedules an online or in-person meeting, the details and joining link will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interviews.map((interview) => (
                      <div
                        key={interview._id}
                        className="bg-gradient-to-br from-purple-50/50 via-white to-blue-50/40 border border-purple-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                              {interview.job?.company?.companyName || 'Company'}
                            </span>
                            <h3 className="font-bold text-gray-900 text-base mt-0.5">
                              {interview.job?.title || 'Position'}
                            </h3>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            {interview.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-xs text-gray-600 mb-4 bg-white/70 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="font-semibold text-gray-800">
                              {new Date(interview.interviewDate).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              ({interview.timeZone || 'UTC'})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>
                              {interview.duration} Minutes •{' '}
                              <strong className="capitalize">{interview.interviewType}</strong>
                            </span>
                          </div>
                          {interview.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>{interview.location}</span>
                            </div>
                          )}
                        </div>

                        {interview.instructions && (
                          <p className="text-xs text-gray-500 italic mb-4 line-clamp-2">
                            "{interview.instructions}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-purple-100">
                          {interview.interviewType === 'online' && interview.meetingUrl ? (
                            <a
                              href={interview.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Interview</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">In-Person Meeting</span>
                          )}

                          <button
                            onClick={() => {
                              setSelectedApp(interview.application)
                              setTimelineOpen(true)
                            }}
                            className="text-xs font-semibold text-purple-700 hover:underline cursor-pointer"
                          >
                            View Timeline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ApplicationTimelineDialog
        open={timelineOpen}
        setOpen={setTimelineOpen}
        application={selectedApp}
      />

      <Footer />
    </>
  )
}

export default SeekerDashboard
