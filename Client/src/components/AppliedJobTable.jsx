import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useSelector } from 'react-redux'
import ApplicationTimelineDialog, { getStatusBadgeColor } from './ApplicationTimelineDialog'
import ApplicationDetailsDialog from './ApplicationDetailsDialog'
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Video,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Clock,
  Eye,
  Building,
  MapPin,
  Sparkles,
} from 'lucide-react'

const FILTER_TABS = [
  'All',
  'Applied',
  'Under Review',
  'Accepted',
  'Round 1',
  'Round 2',
  'Round 3',
  'Interview Scheduled',
  'Selected',
  'Rejected',
]

const AppliedJobTable = () => {
  const { allAppliedJobs } = useSelector((store) => store.job)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Timeline Dialog State
  const [selectedTimelineApp, setSelectedTimelineApp] = useState(null)
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)

  // Details Dialog State
  const [selectedDetailsApp, setSelectedDetailsApp] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const handleOpenTimeline = (app) => {
    setSelectedTimelineApp(app)
    setTimelineDialogOpen(true)
  }

  const handleOpenDetails = (app) => {
    setSelectedDetailsApp(app)
    setDetailsDialogOpen(true)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Filter applications
  const filteredJobs = (allAppliedJobs || []).filter((item) => {
    const titleMatch = item?.job?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const companyMatch = item?.job?.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    const locationMatch = item?.job?.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSearch = !searchTerm || titleMatch || companyMatch || locationMatch

    if (!matchesSearch) return false
    if (statusFilter === 'All') return true

    const currentStatus = (item?.status || '').toLowerCase()
    if (statusFilter === 'Applied') return currentStatus === 'applied' || currentStatus === 'pending'
    if (statusFilter === 'Under Review') return currentStatus.includes('review')
    if (statusFilter === 'Accepted') return currentStatus.includes('accept')
    if (statusFilter === 'Round 1') return currentStatus.includes('round 1')
    if (statusFilter === 'Round 2') return currentStatus.includes('round 2')
    if (statusFilter === 'Round 3') return currentStatus.includes('round 3')
    if (statusFilter === 'Interview Scheduled') {
      const hasInterview = item?.interviews && item.interviews.length > 0 && item.interviews.some((i) => i.status === 'Scheduled')
      return currentStatus.includes('interview') || hasInterview
    }
    if (statusFilter === 'Selected') return currentStatus.includes('select') || currentStatus.includes('offer')
    if (statusFilter === 'Rejected') return currentStatus.includes('reject')

    return currentStatus === statusFilter.toLowerCase()
  })

  // Calculate count for each filter tab
  const getFilterCount = (tab) => {
    if (tab === 'All') return allAppliedJobs?.length || 0
    return (allAppliedJobs || []).filter((item) => {
      const currentStatus = (item?.status || '').toLowerCase()
      if (tab === 'Applied') return currentStatus === 'applied' || currentStatus === 'pending'
      if (tab === 'Under Review') return currentStatus.includes('review')
      if (tab === 'Accepted') return currentStatus.includes('accept')
      if (tab === 'Round 1') return currentStatus.includes('round 1')
      if (tab === 'Round 2') return currentStatus.includes('round 2')
      if (tab === 'Round 3') return currentStatus.includes('round 3')
      if (tab === 'Interview Scheduled') {
        const hasInterview = item?.interviews && item.interviews.length > 0 && item.interviews.some((i) => i.status === 'Scheduled')
        return currentStatus.includes('interview') || hasInterview
      }
      if (tab === 'Selected') return currentStatus.includes('select') || currentStatus.includes('offer')
      if (tab === 'Rejected') return currentStatus.includes('reject')
      return currentStatus === tab.toLowerCase()
    }).length
  }

  return (
    <div>
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-5">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {FILTER_TABS.map((st) => {
            const count = getFilterCount(st)
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === st ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
        <Table>
          <TableCaption className="py-3 text-xs text-gray-400">
            Displaying {filteredJobs.length} of {allAppliedJobs?.length || 0} total applications
          </TableCaption>
          <TableHeader className="bg-gray-50/70">
            <TableRow>
              <TableHead className="font-semibold text-gray-700 text-xs">Applied Date</TableHead>
              <TableHead className="font-semibold text-gray-700 text-xs">Role & Company</TableHead>
              <TableHead className="font-semibold text-gray-700 text-xs">Interview Details</TableHead>
              <TableHead className="font-semibold text-gray-700 text-xs">Current Stage</TableHead>
              <TableHead className="text-right font-semibold text-gray-700 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredJobs || filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-14">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Briefcase className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                    <p className="font-semibold text-gray-700 text-sm">No applications found</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">
                      {searchTerm || statusFilter !== 'All'
                        ? 'No applications match your active search or filter. Try clearing filters.'
                        : "You haven't submitted any job applications yet."}
                    </p>
                    {(searchTerm || statusFilter !== 'All') && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('All')
                        }}
                        className="text-xs text-purple-600 mt-2"
                      >
                        Reset filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((item, index) => {
                const latestInterview =
                  item?.interviews && item.interviews.length > 0
                    ? item.interviews[item.interviews.length - 1]
                    : null

                const hasActiveInterview =
                  latestInterview && latestInterview.status !== 'Cancelled'

                const latestUpdateDate =
                  item.latestStatusUpdateAt || item.updatedAt || item.createdAt

                return (
                  <TableRow key={item._id || index} className="hover:bg-purple-50/20 transition-colors">
                    {/* Applied Date & Last Updated */}
                    <TableCell className="whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-900">
                        {formatDate(item.createdAt)}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>Updated: {formatDate(latestUpdateDate)}</span>
                      </div>
                    </TableCell>

                    {/* Role, Company, Location */}
                    <TableCell>
                      <div className="font-bold text-gray-900 text-sm">
                        {item?.job?.title || 'Position'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Building className="w-3 h-3 text-gray-400" />
                          {item?.job?.company?.companyName || 'Company'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {item?.job?.location || 'Remote'}
                        </span>
                      </div>
                      {item?.feedback && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200/50 max-w-xs truncate">
                          <span>Feedback: "{item.feedback}"</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Interview Schedule Details */}
                    <TableCell>
                      {hasActiveInterview ? (
                        <div className="flex flex-col gap-1">
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md w-fit border border-purple-100">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {latestInterview.roundNumber ? `Round ${latestInterview.roundNumber} • ` : ''}
                              {new Date(latestInterview.interviewDate).toLocaleDateString('en-US', {
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
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2"
                              >
                                <Video className="w-3 h-3" />
                                <span>Join Call</span>
                              </a>
                            ) : latestInterview.location ? (
                              <span className="text-gray-600 truncate max-w-[160px]">
                                📍 {latestInterview.location}
                              </span>
                            ) : (
                              <span className="text-gray-500 capitalize">{latestInterview.interviewType}</span>
                            )}
                          </div>
                          {latestInterview.instructions && (
                            <div className="text-[10px] text-gray-500 italic max-w-xs truncate" title={latestInterview.instructions}>
                              Instr: {latestInterview.instructions}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {item?.currentRound && (
                            <span className="text-xs font-semibold text-purple-700">{item.currentRound}</span>
                          )}
                          <span className="text-xs text-gray-400 italic">None scheduled</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Status / Stage Badge */}
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge className={`${getStatusBadgeColor(item?.status)} px-2.5 py-0.5 text-xs font-semibold border`}>
                          {(item?.status || 'Applied').toUpperCase()}
                        </Badge>
                        {item?.currentRound && item.currentRound !== item.status && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            Round: {item.currentRound}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions: View Details and Track Timeline */}
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          onClick={() => handleOpenDetails(item)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 rounded-xl gap-1.5"
                          title="View job and application details"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span>Details</span>
                        </Button>

                        <Button
                          onClick={() => handleOpenTimeline(item)}
                          size="sm"
                          className="h-8 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5 shadow-xs"
                          title="Track visual stage timeline"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Timeline</span>
                          <ChevronRight className="w-3 h-3 opacity-70" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Visual Timeline Dialog */}
      <ApplicationTimelineDialog
        open={timelineDialogOpen}
        setOpen={setTimelineDialogOpen}
        application={selectedTimelineApp}
      />

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        open={detailsDialogOpen}
        setOpen={setDetailsDialogOpen}
        application={selectedDetailsApp}
        onOpenTimeline={(app) => handleOpenTimeline(app)}
      />
    </div>
  )
}

export default AppliedJobTable
