import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setAllAdminJobs } from '@/redux/jobSlice'
import axios from 'axios'
import {
  JOB_API_END_POINT,
  APPLICANT_API_END_POINT,
  INTERVIEW_API_END_POINT,
  COMPANY_API_END_POINT,
  resolveResumeUrl,
} from '@/utils/constant'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Users,
  Clock,
  Calendar,
  FileCheck2,
  Plus,
  RefreshCw,
  ExternalLink,
  Video,
  Eye,
  Edit2,
  Building,
  CheckCircle2,
  MapPin,
  Ban,
  CalendarPlus,
  Search,
  Filter,
  FileText,
  Sparkles,
  MessageSquare,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle,
  Hash,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'
import ScheduleInterviewDialog from './ScheduleInterviewDialog'
import ApplicationTimelineDialog, { getStatusBadgeColor } from '../ApplicationTimelineDialog'
import CandidateActionModal from './CandidateActionModal'

const HIRING_STAGES = [
  { label: 'Under Review', value: 'Under Review', color: 'text-blue-600 hover:bg-blue-50' },
  { label: 'Accept for Consideration', value: 'Accepted', color: 'text-teal-600 hover:bg-teal-50' },
  { label: 'Shortlist — Round 1', value: 'Shortlisted — Round 1', color: 'text-amber-600 hover:bg-amber-50' },
  { label: 'Round 1 Completed', value: 'Round 1 Completed', color: 'text-indigo-600 hover:bg-indigo-50' },
  { label: 'Advance to Round 2', value: 'Shortlisted — Round 2', color: 'text-amber-600 hover:bg-amber-50' },
  { label: 'Round 2 Completed', value: 'Round 2 Completed', color: 'text-indigo-600 hover:bg-indigo-50' },
  { label: 'Advance to Round 3', value: 'Shortlisted — Round 3', color: 'text-amber-600 hover:bg-amber-50' },
  { label: 'Round 3 Completed', value: 'Round 3 Completed', color: 'text-indigo-600 hover:bg-indigo-50' },
  { label: 'Mark as Selected', value: 'Selected', color: 'text-emerald-600 hover:bg-emerald-50' },
  { label: 'Reject Application', value: 'Rejected', color: 'text-rose-600 hover:bg-rose-50' },
]

const STAGE_FILTERS = [
  'All',
  'Applied',
  'Under Review',
  'Accepted',
  'Shortlisted — Round 1',
  'Round 1 Completed',
  'Shortlisted — Round 2',
  'Round 2 Completed',
  'Shortlisted — Round 3',
  'Round 3 Completed',
  'Selected',
  'Rejected',
]

const RecruiterDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { allAdminJobs } = useSelector((store) => store.job)

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    awaitingReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    selected: 0,
    rejected: 0,
    upcomingInterviews: 0,
  })

  const [interviews, setInterviews] = useState([])
  const [companies, setCompanies] = useState([])
  const [activeTab, setActiveTab] = useState('applicants') // 'applicants' | 'jobs' | 'interviews'
  const [searchTerm, setSearchTerm] = useState('')

  // All Applicants Tab States
  const [applicants, setApplicants] = useState([])
  const [applicantsTotal, setApplicantsTotal] = useState(0)
  const [applicantsPage, setApplicantsPage] = useState(1)
  const [applicantsTotalPages, setApplicantsTotalPages] = useState(1)
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('')
  const [selectedJobFilter, setSelectedJobFilter] = useState('')
  const [selectedStageFilter, setSelectedStageFilter] = useState('All')
  const [applicantSearch, setApplicantSearch] = useState('')
  const [applicantSort, setApplicantSort] = useState('desc')

  // Modals & Dialogs
  const [timelineApp, setTimelineApp] = useState(null)
  const [timelineOpen, setTimelineOpen] = useState(false)

  const [scheduleApp, setScheduleApp] = useState(null)
  const [existingInterview, setExistingInterview] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const [stageTarget, setStageTarget] = useState(null) // { application, targetStage, stageLabel }
  const [stageFeedback, setStageFeedback] = useState('')
  const [updatingStage, setUpdatingStage] = useState(false)

  // Candidate Action & Email Confirmation Modal State
  const [candidateActionTarget, setCandidateActionTarget] = useState(null) // { application, actionType }
  const [candidateActionOpen, setCandidateActionOpen] = useState(false)

  const handleOpenCandidateAction = (application, actionType) => {
    setCandidateActionTarget({ application, actionType })
    setCandidateActionOpen(true)
  }

  const handleCandidateActionSuccess = (updatedApp) => {
    if (updatedApp) {
      setApplicants((prev) =>
        prev.map((app) => (app._id === updatedApp._id ? { ...app, ...updatedApp } : app))
      )
      fetchDashboardData()
    }
  }

  // Retry Failed Email Notification
  const handleRetryEmail = async (applicationId) => {
    try {
      toast.loading('Retrying email delivery...', { id: 'recruiter-retry-email' })
      const res = await axios.post(
        `${APPLICANT_API_END_POINT}/${applicationId}/retry-email`,
        {},
        { withCredentials: true }
      )
      if (res.data.success) {
        toast.success(res.data.message || 'Notification email dispatched successfully!', { id: 'recruiter-retry-email' })
        setApplicants((prev) =>
          prev.map((app) =>
            app._id === applicationId
              ? { ...app, lastEmailError: null, lastEmailSentAt: new Date() }
              : app
          )
        )
      } else {
        toast.error(res.data.message || 'Email delivery failed', { id: 'recruiter-retry-email', duration: 8000 })
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Email retry failed',
        { id: 'recruiter-retry-email', duration: 8000 }
      )
    }
  }

  const [notesApp, setNotesApp] = useState(null)
  const [notesText, setNotesText] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  // Fetch Dashboard Stats, Jobs, Companies, Interviews
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, jobsRes, interviewsRes, companiesRes] = await Promise.allSettled([
        axios.get(`${APPLICANT_API_END_POINT}/recruiter/stats`, { withCredentials: true }),
        axios.get(`${JOB_API_END_POINT}/get-recruiter-job`, { withCredentials: true }),
        axios.get(`${INTERVIEW_API_END_POINT}/my-interviews?filter=upcoming`, { withCredentials: true }),
        axios.get(`${COMPANY_API_END_POINT}/get`, { withCredentials: true }),
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.stats)
      }

      if (jobsRes.status === 'fulfilled' && jobsRes.value.data.success) {
        dispatch(setAllAdminJobs(jobsRes.value.data.jobs || []))
      }

      if (interviewsRes.status === 'fulfilled' && interviewsRes.value.data.success) {
        setInterviews(interviewsRes.value.data.interviews || [])
      }

      if (companiesRes.status === 'fulfilled' && companiesRes.value.data.success) {
        setCompanies(companiesRes.value.data.companies || [])
      }
    } catch (error) {
      console.error('Error fetching recruiter dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch All Applicants Across Owned Jobs & Companies
  const fetchAllApplicants = async (page = 1) => {
    setApplicantsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 10)
      if (selectedCompanyFilter) params.append('companyId', selectedCompanyFilter)
      if (selectedJobFilter) params.append('jobId', selectedJobFilter)
      if (selectedStageFilter && selectedStageFilter !== 'All') params.append('status', selectedStageFilter)
      if (applicantSearch.trim()) params.append('search', applicantSearch.trim())
      params.append('sortBy', 'createdAt')
      params.append('sortOrder', applicantSort)

      const res = await axios.get(`${APPLICANT_API_END_POINT}/recruiter/all?${params.toString()}`, {
        withCredentials: true,
      })

      if (res.data.success) {
        setApplicants(res.data.applications || [])
        setApplicantsTotal(res.data.total || 0)
        setApplicantsPage(res.data.page || 1)
        setApplicantsTotalPages(res.data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching all recruiter applicants:', error)
      toast.error(error.response?.data?.message || 'Failed to load applicants')
    } finally {
      setApplicantsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    fetchAllApplicants(1)
  }, [selectedCompanyFilter, selectedJobFilter, selectedStageFilter, applicantSort])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchAllApplicants(1)
  }

  // Status Change Handler with Feedback
  const handleUpdateStatus = async (status, applicationId, feedback = '') => {
    try {
      setUpdatingStage(true)
      const res = await axios.post(
        `${APPLICANT_API_END_POINT}/status/${applicationId}/update`,
        { status, feedback },
        { withCredentials: true }
      )

      if (res.data.success) {
        toast.success(res.data.message || 'Candidate status updated!')
        setStageTarget(null)
        setStageFeedback('')
        fetchAllApplicants(applicantsPage)
        fetchDashboardData()
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to update candidate status')
    } finally {
      setUpdatingStage(false)
    }
  }

  // Cancel Interview Handler
  const handleCancelInterview = async (interviewId) => {
    try {
      const res = await axios.put(
        `${INTERVIEW_API_END_POINT}/${interviewId}/cancel`,
        { reason: 'Cancelled by recruiter from dashboard' },
        { withCredentials: true }
      )
      if (res.data.success) {
        toast.success('Interview cancelled successfully')
        setInterviews((prev) => prev.filter((i) => i._id !== interviewId))
        fetchAllApplicants(applicantsPage)
        fetchDashboardData()
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to cancel interview')
    }
  }

  // Save Internal Notes
  const handleSaveNotes = async () => {
    if (!notesApp) return
    try {
      setSavingNotes(true)
      const res = await axios.post(
        `${APPLICANT_API_END_POINT}/status/${notesApp._id}/update`,
        { status: notesApp.status, notes: notesText },
        { withCredentials: true }
      )
      if (res.data.success) {
        toast.success('Internal notes saved successfully!')
        setNotesOpen(false)
        fetchAllApplicants(applicantsPage)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const filteredJobs = (allAdminJobs || []).filter((job) => {
    const titleMatch = job.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const companyMatch = job.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    return titleMatch || companyMatch
  })

  const metricCards = [
    {
      label: 'Jobs Posted',
      value: stats.totalJobs || allAdminJobs?.length || 0,
      icon: Briefcase,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      label: 'Total Applicants',
      value: stats.totalApplicants || applicantsTotal || 0,
      icon: Users,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Awaiting Review',
      value: stats.awaitingReview || 0,
      icon: Clock,
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
    },
    {
      label: 'Shortlisted / Rounds',
      value: stats.shortlisted || 0,
      icon: FileCheck2,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: 'Upcoming Interviews',
      value: stats.upcomingInterviews || interviews?.length || 0,
      icon: Calendar,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      label: 'Selected / Hired',
      value: stats.selected || 0,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
  ]

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100/70 px-3 py-1 rounded-full">
                  Recruiter Console
                </span>
                <span className="text-xs text-gray-500">Talent Acquisition & Multi-Round Pipeline Hub</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
                Recruiter Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage candidate pipelines across all your companies, track hiring rounds, and schedule interviews.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  fetchDashboardData()
                  fetchAllApplicants(applicantsPage)
                }}
                variant="outline"
                size="sm"
                className="gap-1.5 border-gray-200 rounded-xl text-xs hover:border-purple-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading || applicantsLoading ? 'animate-spin' : ''}`} />
                <span>Sync Data</span>
              </Button>
              <Button
                onClick={() => navigate('/admin/jobs/create')}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Job</span>
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {metricCards.map((m, idx) => {
              const Icon = m.icon
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 truncate">{m.label}</span>
                    <div className={`w-7 h-7 rounded-lg ${m.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${m.textColor}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{m.value}</div>
                </motion.div>
              )
            })}
          </div>

          {/* Main Console Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            {/* Tab Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab('applicants')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'applicants'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>All Applicants</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'applicants' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {stats.totalApplicants || applicantsTotal || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'jobs'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Posted Jobs</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'jobs' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {allAdminJobs?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('interviews')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'interviews'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming Interviews</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'interviews' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {interviews?.length || 0}
                  </span>
                </button>
              </div>

              {activeTab === 'jobs' && (
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search your jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}
            </div>

            {/* TAB 1: ALL APPLICANTS ACROSS ALL COMPANIES & JOBS */}
            {activeTab === 'applicants' && (
              <div className="space-y-5">
                {/* Filter and Search Bar */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search candidates by name, email, or job title..."
                        value={applicantSearch}
                        onChange={(e) => setApplicantSearch(e.target.value)}
                        className="w-full pl-9 pr-20 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="absolute right-1 top-1 bottom-1 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Search
                      </Button>
                    </form>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Company Filter */}
                      <select
                        value={selectedCompanyFilter}
                        onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                        className="h-9 px-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium"
                      >
                        <option value="">All Companies</option>
                        {companies.map((comp) => (
                          <option key={comp._id} value={comp._id}>
                            {comp.companyName}
                          </option>
                        ))}
                      </select>

                      {/* Job Filter */}
                      <select
                        value={selectedJobFilter}
                        onChange={(e) => setSelectedJobFilter(e.target.value)}
                        className="h-9 px-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium max-w-[180px] truncate"
                      >
                        <option value="">All Jobs</option>
                        {(allAdminJobs || []).map((j) => (
                          <option key={j._id} value={j._id}>
                            {j.title}
                          </option>
                        ))}
                      </select>

                      {/* Stage Filter */}
                      <select
                        value={selectedStageFilter}
                        onChange={(e) => setSelectedStageFilter(e.target.value)}
                        className="h-9 px-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium"
                      >
                        {STAGE_FILTERS.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage === 'All' ? 'All Stages' : stage}
                          </option>
                        ))}
                      </select>

                      {/* Sort Filter */}
                      <select
                        value={applicantSort}
                        onChange={(e) => setApplicantSort(e.target.value)}
                        className="h-9 px-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>

                      {(selectedCompanyFilter || selectedJobFilter || selectedStageFilter !== 'All' || applicantSearch) && (
                        <button
                          onClick={() => {
                            setSelectedCompanyFilter('')
                            setSelectedJobFilter('')
                            setSelectedStageFilter('All')
                            setApplicantSearch('')
                          }}
                          className="text-xs text-purple-700 hover:underline font-semibold px-2 cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>
                      Displaying <strong>{applicants.length}</strong> of <strong>{applicantsTotal}</strong> total applicants
                    </span>
                    {applicantsLoading && (
                      <span className="flex items-center gap-1.5 text-purple-600 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Fetching records...
                      </span>
                    )}
                  </div>
                </div>

                {/* Applicants Table */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader className="bg-gray-50/70">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 text-xs">Candidate</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs">Job & Company</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs">Resume</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs">Stage</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs">Interview Status</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applicantsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-gray-400 text-xs">
                            <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
                            Loading candidate records...
                          </TableCell>
                        </TableRow>
                      ) : applicants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-gray-400">
                            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2 stroke-1" />
                            <h4 className="text-sm font-bold text-gray-800">No Applicants Found</h4>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                              {selectedCompanyFilter || selectedJobFilter || selectedStageFilter !== 'All' || applicantSearch
                                ? 'No applications match your active filters. Try clearing some filters.'
                                : 'No candidates have submitted applications for your jobs yet.'}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        applicants.map((item) => {
                          const latestInterview =
                            item?.interviews && item.interviews.length > 0
                              ? item.interviews[item.interviews.length - 1]
                              : null

                          const hasActiveInterview =
                            latestInterview && latestInterview.status !== 'Cancelled'

                          return (
                            <TableRow key={item._id} className="hover:bg-purple-50/20 transition-colors">
                              {/* Candidate Info */}
                              <TableCell>
                                <div className="font-semibold text-gray-900 text-xs">
                                  {item?.applicant?.fullname || 'Anonymous Candidate'}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono mt-0.5">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span>{item?.applicant?.email || 'No email'}</span>
                                </div>
                                {item?.applicant?.phoneNumber && (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono mt-0.5">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    <span>{item.applicant.phoneNumber}</span>
                                  </div>
                                )}
                                <div className="text-[10px] text-gray-400 mt-1">
                                  App ID: <span className="font-mono">#{item._id?.slice(-6)}</span> • Applied {item.createdAt ? item.createdAt.split('T')[0] : 'N/A'}
                                </div>
                              </TableCell>

                              {/* Job Title & Company */}
                              <TableCell>
                                <div className="font-semibold text-gray-900 text-xs">
                                  {item?.job?.title || 'Job Opening'}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                  <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span>{item?.job?.company?.companyName || 'Company'}</span>
                                  {item?.job?.company?._id && (
                                    <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.2 rounded">
                                      #{item.job.company._id.slice(-4)}
                                    </span>
                                  )}
                                </div>
                                {item.feedback && (
                                  <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50 mt-1 max-w-[200px] truncate">
                                    "{item.feedback}"
                                  </div>
                                )}
                              </TableCell>

                              {/* Resume Link */}
                              <TableCell>
                                {item?.applicant?.profile?.resume ? (
                                  <a
                                    href={resolveResumeUrl(item.applicant.profile.resume)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">
                                      {item.applicant.profile.resumeOriginalName || 'Resume'}
                                    </span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No resume</span>
                                )}
                              </TableCell>

                              {/* Current Stage */}
                              <TableCell>
                                <div className="flex flex-col items-start gap-1">
                                  <Badge className={`${getStatusBadgeColor(item?.status)} px-2.5 py-0.5 text-[11px] font-semibold border`}>
                                    {item?.status || 'Applied'}
                                  </Badge>
                                  {item?.lastEmailError && (
                                    <button
                                      type="button"
                                      onClick={() => handleRetryEmail(item._id)}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                      title={`Email error: ${item.lastEmailError}. Click to retry.`}
                                    >
                                      <RefreshCw className="w-2.5 h-2.5" />
                                      <span>Retry Email</span>
                                    </button>
                                  )}
                                </div>
                              </TableCell>

                              {/* Interview Info */}
                              <TableCell>
                                {hasActiveInterview ? (
                                  <div className="flex flex-col gap-1">
                                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md w-fit">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        Round {latestInterview.roundNumber || 1} • {new Date(latestInterview.interviewDate).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px]">
                                      {latestInterview.interviewType === 'online' && latestInterview.meetingUrl ? (
                                        <a
                                          href={latestInterview.meetingUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-purple-600 hover:text-purple-800 font-semibold underline"
                                        >
                                          Join Call
                                        </a>
                                      ) : (
                                        <span className="text-gray-500 capitalize">{latestInterview.interviewType}</span>
                                      )}
                                      <button
                                        onClick={() => {
                                          setScheduleApp(item)
                                          setExistingInterview(latestInterview)
                                          setScheduleOpen(true)
                                        }}
                                        className="text-gray-500 hover:text-purple-600 font-medium cursor-pointer"
                                      >
                                        Reschedule
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => {
                                      setScheduleApp(item)
                                      setExistingInterview(null)
                                      setScheduleOpen(true)
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs font-semibold text-purple-600 border-purple-200 hover:bg-purple-50 rounded-lg gap-1 cursor-pointer"
                                  >
                                    <CalendarPlus className="w-3 h-3" />
                                    <span>Schedule</span>
                                  </Button>
                                )}
                              </TableCell>

                              {/* Actions Menu */}
                              <TableCell className="text-right">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-56 p-2 rounded-2xl shadow-lg border border-gray-100" align="end">
                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                                      Candidate Actions
                                    </div>

                                    {/* 1. Shortlist Candidate */}
                                    <div
                                      onClick={() => handleOpenCandidateAction(item, 'shortlist')}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 cursor-pointer transition-colors"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Shortlist Candidate</span>
                                    </div>

                                    {/* 2. Move to Next Round */}
                                    <div
                                      onClick={() => handleOpenCandidateAction(item, 'next_round')}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50 cursor-pointer transition-colors"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Move to Next Round</span>
                                    </div>

                                    {/* 3. Schedule Interview */}
                                    <div
                                      onClick={() => {
                                        setScheduleApp(item)
                                        setExistingInterview(hasActiveInterview ? latestInterview : null)
                                        setScheduleOpen(true)
                                      }}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 cursor-pointer transition-colors"
                                    >
                                      <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                                      <span>{hasActiveInterview ? 'Reschedule Interview' : 'Schedule Interview'}</span>
                                    </div>

                                    {/* 4. Select Candidate */}
                                    <div
                                      onClick={() => handleOpenCandidateAction(item, 'select')}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Select Candidate</span>
                                    </div>

                                    {/* 5. Reject Candidate */}
                                    <div
                                      onClick={() => handleOpenCandidateAction(item, 'reject')}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                                    >
                                      <Ban className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Reject Candidate</span>
                                    </div>

                                    {/* Retry Email Action if failed */}
                                    {item.lastEmailError && (
                                      <div
                                        onClick={() => handleRetryEmail(item._id)}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors mt-0.5 border border-rose-100"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>Retry Email Delivery</span>
                                      </div>
                                    )}

                                    <div className="h-px bg-gray-100 my-1.5" />

                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                                      Other Stages
                                    </div>

                                    {HIRING_STAGES.map((stage) => (
                                      <div
                                        key={stage.value}
                                        onClick={() =>
                                          setStageTarget({
                                            application: item,
                                            targetStage: stage.value,
                                            stageLabel: stage.label,
                                          })
                                        }
                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${stage.color}`}
                                      >
                                        <span>{stage.label}</span>
                                      </div>
                                    ))}

                                    <div className="h-px bg-gray-100 my-1.5" />

                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                                      Tools
                                    </div>

                                    {hasActiveInterview && (
                                      <div
                                        onClick={() => handleCancelInterview(latestInterview._id)}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span>Cancel Interview</span>
                                      </div>
                                    )}

                                    <div
                                      onClick={() => {
                                        setNotesApp(item)
                                        setNotesText(item.internalNotes || '')
                                        setNotesOpen(true)
                                      }}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                                      <span>Internal Notes</span>
                                    </div>

                                    <div
                                      onClick={() => {
                                        setTimelineApp(item)
                                        setTimelineOpen(true)
                                      }}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                      <span>View Timeline</span>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {applicantsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">
                      Page {applicantsPage} of {applicantsTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={applicantsPage <= 1 || applicantsLoading}
                        onClick={() => fetchAllApplicants(applicantsPage - 1)}
                        className="rounded-xl text-xs gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={applicantsPage >= applicantsTotalPages || applicantsLoading}
                        onClick={() => fetchAllApplicants(applicantsPage + 1)}
                        className="rounded-xl text-xs gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: POSTED JOBS */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
                    <h3 className="text-sm font-bold text-gray-800">No Job Openings Found</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      You haven't posted any jobs yet. Create your first listing to start receiving applicants!
                    </p>
                    <Button
                      onClick={() => navigate('/admin/jobs/create')}
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl"
                    >
                      Post Your First Job
                    </Button>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div
                      key={job._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/70 hover:bg-purple-50/20 border border-gray-100 rounded-2xl transition-colors gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">{job.title}</h3>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
                            {job.jobType || 'Full Time'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            {job.company?.companyName || 'Company'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {job.location}
                          </span>
                          <span>•</span>
                          <span>Posted {job.createdAt ? job.createdAt.split('T')[0] : 'Recently'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          onClick={() => {
                            setSelectedJobFilter(job._id)
                            setActiveTab('applicants')
                          }}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Applicants ({job.applications?.length || 0})</span>
                        </Button>

                        <Button
                          onClick={() => navigate(`/admin/jobs/${job._id}`)}
                          variant="outline"
                          size="sm"
                          className="border-gray-200 text-gray-600 hover:text-purple-700 text-xs rounded-xl gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: SCHEDULED INTERVIEWS */}
            {activeTab === 'interviews' && (
              <div>
                {interviews.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
                    <h3 className="text-sm font-bold text-gray-800">No Upcoming Interviews Scheduled</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Go to the Applicants tab and click "Schedule" to arrange interviews with candidates.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interviews.map((interview) => (
                      <div
                        key={interview._id}
                        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                              {interview.job?.title || 'Job Opening'}
                            </span>
                            <h3 className="font-bold text-gray-900 text-base mt-0.5">
                              {interview.candidate?.fullname || 'Candidate'}
                            </h3>
                            <span className="text-xs text-gray-500 font-mono">
                              {interview.candidate?.email}
                            </span>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800">
                            {interview.status}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="font-semibold text-gray-800">
                              Round {interview.roundNumber || 1} • {new Date(interview.interviewDate).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              ({interview.timeZone || 'UTC'})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>
                              {interview.duration} Minutes •{' '}
                              <strong className="capitalize">{interview.interviewType}</strong>
                            </span>
                          </div>
                          {interview.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{interview.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          {interview.interviewType === 'online' && interview.meetingUrl ? (
                            <a
                              href={interview.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Call</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">In-Person</span>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setScheduleApp(interview.application)
                                setExistingInterview(interview)
                                setScheduleOpen(true)
                              }}
                              className="text-xs font-semibold text-purple-700 hover:underline cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <span className="text-gray-300">•</span>
                            <button
                              onClick={() => handleCancelInterview(interview._id)}
                              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
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

      {/* Stage Transition Dialog with Candidate Feedback */}
      <Dialog open={Boolean(stageTarget)} onOpenChange={() => setStageTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Advance Candidate • {stageTarget?.stageLabel}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 pt-1">
              Transition <strong>{stageTarget?.application?.applicant?.fullname}</strong> to stage <strong>{stageTarget?.targetStage}</strong>. An automated notification will be dispatched to their registered email.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Feedback / Notes for Candidate (Optional)
            </label>
            <Textarea
              rows={3}
              value={stageFeedback}
              onChange={(e) => setStageFeedback(e.target.value)}
              placeholder="e.g. Cleared round 1 technical interview, moving forward to system design review..."
              className="rounded-xl border-gray-200 text-xs"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              This feedback will be stored on the candidate's profile and sent in their email notification.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStageTarget(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdateStatus(stageTarget.targetStage, stageTarget.application._id, stageFeedback)}
              disabled={updatingStage}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs"
            >
              {updatingStage ? 'Updating...' : `Confirm • ${stageTarget?.targetStage}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule / Reschedule Dialog */}
      <ScheduleInterviewDialog
        open={scheduleOpen}
        setOpen={setScheduleOpen}
        application={scheduleApp}
        existingInterview={existingInterview}
        onSuccess={() => {
          fetchDashboardData()
          fetchAllApplicants(applicantsPage)
        }}
      />

      {/* Recruiter Functional Candidate Action & Email Dialog */}
      <CandidateActionModal
        open={candidateActionOpen}
        onOpenChange={setCandidateActionOpen}
        application={candidateActionTarget?.application}
        actionType={candidateActionTarget?.actionType}
        onSuccess={handleCandidateActionSuccess}
      />

      {/* Visual Timeline Dialog */}
      <ApplicationTimelineDialog
        open={timelineOpen}
        setOpen={setTimelineOpen}
        application={timelineApp}
      />

      {/* Internal Notes Dialog */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Candidate Notes • {notesApp?.applicant?.fullname}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Internal private notes visible only to your recruiting team.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2">
            <Textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="e.g. Strong problem-solving skills, follow up on references..."
              className="rounded-xl border-gray-200 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setNotesOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs"
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}

export default RecruiterDashboard
