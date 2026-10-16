import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Building,
  MapPin,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Briefcase,
  DollarSign,
  FileText,
  Sparkles,
  ChevronRight,
  User,
  Mail,
  Phone,
} from 'lucide-react'
import { getStatusBadgeColor } from './ApplicationTimelineDialog'

const ApplicationDetailsDialog = ({ open, setOpen, application, onOpenTimeline }) => {
  if (!application) return null

  const job = application.job || {}
  const company = job.company || {}
  const interviews = application.interviews || []
  const latestInterview = interviews.length > 0 ? interviews[interviews.length - 1] : null
  const hasActiveInterview = latestInterview && latestInterview.status !== 'Cancelled'

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Application Details
            </span>
            <Badge className={`${getStatusBadgeColor(application.status)} px-3 py-1 text-xs font-semibold`}>
              {(application.status || 'Applied').toUpperCase()}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {job.title || 'Job Position'}
          </DialogTitle>
          <DialogDescription className="text-gray-500 flex flex-wrap items-center gap-2 pt-1 text-sm">
            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-purple-600" />
              {company.companyName || 'Company'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {job.location || 'Remote'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Key Application Timestamps & Stage */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px] tracking-wider mb-0.5">Applied Date</span>
              <span className="font-semibold text-gray-800">{formatDate(application.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px] tracking-wider mb-0.5">Last Updated</span>
              <span className="font-semibold text-gray-800">
                {formatDate(application.latestStatusUpdateAt || application.updatedAt || application.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px] tracking-wider mb-0.5">Current Stage</span>
              <span className="font-semibold text-purple-700">{application.currentRound || application.status || 'Applied'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[10px] tracking-wider mb-0.5">Job Type</span>
              <span className="font-semibold text-gray-800">{job.jobType || 'Full-time'}</span>
            </div>
          </div>

          {/* Salary and Positions Strip */}
          <div className="flex flex-wrap items-center gap-3 bg-purple-50/50 border border-purple-100 rounded-xl p-3 text-xs">
            {job.salary && (
              <span className="inline-flex items-center gap-1 font-semibold text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-100">
                <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                {job.salary} LPA
              </span>
            )}
            {job.experienceLevel !== undefined && (
              <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-purple-100">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                {job.experienceLevel} yrs experience
              </span>
            )}
            {job.position && (
              <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-purple-100">
                {job.position} open positions
              </span>
            )}
          </div>

          {/* Active Interview Details Card */}
          {hasActiveInterview && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h4 className="font-bold text-gray-900 text-sm">Upcoming Interview Details</h4>
                </div>
                <Badge className="bg-purple-100 text-purple-800 text-[11px] font-semibold">
                  Round {latestInterview.roundNumber || 1}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs mb-3">
                <div className="bg-white/90 p-2.5 rounded-xl border border-purple-100">
                  <span className="text-gray-400 block text-[11px]">Scheduled Date & Time</span>
                  <span className="font-semibold text-gray-800">{formatDate(latestInterview.interviewDate)}</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-purple-100">
                  <span className="text-gray-400 block text-[11px]">Format & Duration</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {latestInterview.duration} Mins • {latestInterview.interviewType}
                  </span>
                </div>
              </div>

              {latestInterview.instructions && (
                <div className="bg-white/90 p-2.5 rounded-xl border border-purple-100 text-xs text-gray-700 mb-3">
                  <strong className="block text-gray-900 text-[11px] mb-0.5">Instructions:</strong>
                  {latestInterview.instructions}
                </div>
              )}

              {latestInterview.interviewType === 'online' && latestInterview.meetingUrl && (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <Video className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs text-gray-600 truncate font-mono">{latestInterview.meetingUrl}</span>
                  </div>
                  <a
                    href={latestInterview.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    <span>Join Call</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Recruiter Feedback / Notes */}
          {application.feedback && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Hiring Team Feedback</span>
              </div>
              <p className="text-xs text-gray-700 font-medium">"{application.feedback}"</p>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs"
            >
              Close
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setOpen(false)
                if (onOpenTimeline) onOpenTimeline(application)
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
            >
              <span>Track Visual Timeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ApplicationDetailsDialog
