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
  CheckCircle2,
  Clock,
  Calendar,
  Video,
  MapPin,
  ExternalLink,
  AlertCircle,
  FileText,
  Building,
  User,
  ArrowRight,
  Sparkles,
  Check,
  CircleDot,
  XCircle,
} from 'lucide-react'

// Dynamic hiring stages generator based on recruiter configuration
export const getDynamicPipelineStages = (application) => {
  const job = application?.job

  // 1. If job has custom interviewRounds configured by recruiter
  if (job?.interviewRounds && Array.isArray(job.interviewRounds) && job.interviewRounds.length > 0) {
    const rounds = job.interviewRounds.map((r, i) => {
      const num = r.roundNumber || i + 1
      const roundName = r.name || `Round ${num}`
      return {
        key: `Round ${num}`,
        label: roundName,
        roundNumber: num,
        match: (s) => {
          if (!s) return false
          const sl = s.toLowerCase()
          return sl.includes(`round ${num}`) || (roundName && sl.includes(roundName.toLowerCase()))
        },
      }
    })

    return [
      { key: 'Applied', label: 'Application Submitted', match: (s) => s.toLowerCase().includes('applied') || s.toLowerCase().includes('pending') },
      { key: 'Under Review', label: 'Under Review', match: (s) => s.toLowerCase().includes('review') },
      ...rounds,
      { key: 'Selected', label: 'Final Selection & Offer', match: (s) => s.toLowerCase().includes('select') || s.toLowerCase().includes('offer') },
    ]
  }

  // 2. If job has totalRounds specified as a number
  if (job?.totalRounds && Number(job.totalRounds) > 0) {
    const count = Number(job.totalRounds)
    const rounds = Array.from({ length: count }, (_, i) => ({
      key: `Round ${i + 1}`,
      label: count === 1 ? 'Interview Round' : `Round ${i + 1} Interview`,
      roundNumber: i + 1,
      match: (s) => {
        if (!s) return false
        const sl = s.toLowerCase()
        return sl.includes(`round ${i + 1}`) || (count === 1 && (sl.includes('interview') || sl.includes('shortlist')))
      },
    }))

    return [
      { key: 'Applied', label: 'Application Submitted', match: (s) => s.toLowerCase().includes('applied') || s.toLowerCase().includes('pending') },
      { key: 'Under Review', label: 'Under Review', match: (s) => s.toLowerCase().includes('review') },
      ...rounds,
      { key: 'Selected', label: 'Final Selection & Offer', match: (s) => s.toLowerCase().includes('select') || s.toLowerCase().includes('offer') },
    ]
  }

  // 3. Fallback: inspect actual rounds recorded in statusHistory or interviews
  const history = application?.statusHistory || []
  const roundKeysFound = new Set()
  history.forEach((h) => {
    const st = (h.status || '').toLowerCase()
    const m = st.match(/round\s*(\d+)/i)
    if (m) roundKeysFound.add(Number(m[1]))
  })

  if (roundKeysFound.size > 0) {
    const maxRound = Math.max(...Array.from(roundKeysFound))
    const rounds = Array.from({ length: maxRound }, (_, i) => ({
      key: `Round ${i + 1}`,
      label: `Round ${i + 1} Interview`,
      roundNumber: i + 1,
      match: (s) => (s || '').toLowerCase().includes(`round ${i + 1}`),
    }))

    return [
      { key: 'Applied', label: 'Application Submitted', match: (s) => (s || '').toLowerCase().includes('applied') || (s || '').toLowerCase().includes('pending') },
      { key: 'Under Review', label: 'Under Review', match: (s) => (s || '').toLowerCase().includes('review') },
      ...rounds,
      { key: 'Selected', label: 'Final Selection & Offer', match: (s) => (s || '').toLowerCase().includes('select') || (s || '').toLowerCase().includes('offer') },
    ]
  }

  // 4. Default: Standard 2-stage interview rounds
  return [
    { key: 'Applied', label: 'Application Submitted', match: (s) => (s || '').toLowerCase().includes('applied') || (s || '').toLowerCase().includes('pending') },
    { key: 'Under Review', label: 'Under Review', match: (s) => (s || '').toLowerCase().includes('review') },
    { key: 'Round 1', label: 'Round 1 Interview', match: (s) => (s || '').toLowerCase().includes('round 1') || (s || '').toLowerCase().includes('interview') },
    { key: 'Round 2', label: 'Round 2 Interview', match: (s) => (s || '').toLowerCase().includes('round 2') },
    { key: 'Selected', label: 'Final Selection & Offer', match: (s) => (s || '').toLowerCase().includes('select') || (s || '').toLowerCase().includes('offer') },
  ]
}

export const PIPELINE_STAGES = [
  { key: 'Applied', label: 'Application Submitted', match: (s) => s.includes('applied') || s.includes('pending') },
  { key: 'Under Review', label: 'Under Review', match: (s) => s.includes('review') },
  { key: 'Round 1', label: 'Round 1 Interview', match: (s) => s.includes('round 1') || s.includes('interview') },
  { key: 'Round 2', label: 'Round 2 Interview', match: (s) => s.includes('round 2') },
  { key: 'Selected', label: 'Final Selection & Offer', match: (s) => s.includes('select') || s.includes('offer') },
]

export const getStatusBadgeColor = (status = '') => {
  const s = status.toLowerCase()
  if (s.includes('select')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (s.includes('accept')) return 'bg-teal-100 text-teal-800 border-teal-200'
  if (s.includes('reject')) return 'bg-rose-100 text-rose-800 border-rose-200'
  if (s.includes('interview')) return 'bg-purple-100 text-purple-800 border-purple-200'
  if (s.includes('shortlist') || s.includes('round')) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (s.includes('review')) return 'bg-blue-100 text-blue-800 border-blue-200'
  return 'bg-slate-100 text-slate-800 border-slate-200'
}

const ApplicationTimelineDialog = ({ open, setOpen, application }) => {
  if (!application) return null

  const currentStatus = application.status || 'Applied'
  const isRejected = currentStatus.toLowerCase().includes('reject')
  const isSelected = currentStatus.toLowerCase().includes('select')

  // Generate dynamic pipeline stages based on recruiter's job config
  const pipelineStages = getDynamicPipelineStages(application)

  // Helper: format date & time
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
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

  // Determine which stages have ACTUALLY occurred by inspecting statusHistory
  const history = application.statusHistory || []

  // Check if a stage has actually occurred based on real history records
  const getStageActualRecord = (stage) => {
    return history.find((h) => stage.match(h.status || ''))
  }

  // Find index of current status dynamically
  const getCurrentStageIndex = () => {
    if (isSelected) return pipelineStages.length - 1
    for (let i = pipelineStages.length - 1; i >= 0; i--) {
      if (pipelineStages[i].match(currentStatus)) {
        return i
      }
    }
    return 0
  }

  const currentStageIndex = getCurrentStageIndex()

  const latestInterview =
    application.interviews && application.interviews.length > 0
      ? application.interviews[application.interviews.length - 1]
      : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Visual Application Timeline
            </span>
            <Badge className={`${getStatusBadgeColor(currentStatus)} px-3 py-1 text-xs font-semibold`}>
              {currentStatus.toUpperCase()}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {application.job?.title || 'Job Application'}
          </DialogTitle>
          <DialogDescription className="text-gray-500 flex flex-wrap items-center gap-2 pt-1 text-sm">
            <Building className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-gray-700">
              {application.job?.company?.companyName || 'Company'}
            </span>
            <span>•</span>
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{application.job?.location || 'Location'}</span>
            <span>•</span>
            <span className="text-gray-400">
              Applied on {formatDate(application.createdAt)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Outcome Callout if Rejected or Selected */}
        {isRejected && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 my-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-800">Application Closed / Rejected</h4>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                The hiring team decided not to move forward with this application. This application is closed and will not progress to future interview stages unless explicitly reopened by the recruiter.
              </p>
            </div>
          </div>
        )}

        {isSelected && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-800">Candidate Selected — Congratulations! 🎉</h4>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                You have successfully cleared the hiring rounds and been selected for this position. The recruiter will reach out with the offer details.
              </p>
            </div>
          </div>
        )}

        {/* 1. Vertical Hiring Stage Pipeline */}
        <div className="my-6 bg-slate-50/70 border border-slate-200/80 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Hiring Pipeline Stages</span>
            </h4>
            <span className="text-[11px] text-gray-400">
              Only verified stages marked completed
            </span>
          </div>

          <div className="space-y-0 relative">
            {pipelineStages.map((stage, idx) => {
              const actualRecord = getStageActualRecord(stage)
              const hasActuallyOccurred = Boolean(actualRecord)
              const isCurrent = idx === currentStageIndex && !isRejected

              // Styling states
              let nodeColor = 'bg-gray-100 text-gray-400 border-gray-300'
              let statusLabel = 'Upcoming'
              let statusClass = 'text-gray-400'

              if (hasActuallyOccurred && !isCurrent) {
                nodeColor = 'bg-purple-600 text-white border-purple-600 shadow-xs'
                statusLabel = `Completed on ${formatDate(actualRecord.changedAt)}`
                statusClass = 'text-purple-700 font-medium'
              } else if (isCurrent) {
                nodeColor = 'bg-purple-600 text-white border-4 border-purple-200 ring-2 ring-purple-600 animate-pulse'
                statusLabel = `Current Stage • In Progress`
                statusClass = 'text-purple-700 font-bold'
              } else if (isRejected && idx > currentStageIndex) {
                nodeColor = 'bg-gray-100 text-gray-300 border-gray-200'
                statusLabel = 'Not Reached'
                statusClass = 'text-gray-400 line-through'
              }

              const isLast = idx === pipelineStages.length - 1

              return (
                <div key={stage.key || idx} className="flex items-start gap-4 relative pb-6 last:pb-0">
                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div
                      className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px transition-colors ${
                        hasActuallyOccurred ? 'bg-purple-400' : 'bg-gray-200'
                      }`}
                    />
                  )}

                  {/* Stage Node Icon */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all ${nodeColor}`}
                  >
                    {hasActuallyOccurred && !isCurrent ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : isCurrent ? (
                      <CircleDot className="w-4 h-4 text-white" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage Information */}
                  <div className="flex-1 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className={`text-sm font-semibold ${isCurrent ? 'text-gray-900' : hasActuallyOccurred ? 'text-gray-800' : 'text-gray-400'}`}>
                        {stage.label}
                      </span>
                      <span className={`text-xs ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {actualRecord?.notes && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {actualRecord.notes}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. Scheduled Interview Details Card (if exists) */}
        {latestInterview && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-gray-900 text-base">Active Interview Schedule</h4>
              </div>
              <Badge
                className={
                  latestInterview.status === 'Cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : latestInterview.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-purple-100 text-purple-800'
                }
              >
                {latestInterview.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
              <div className="bg-white/90 p-3 rounded-xl border border-purple-100">
                <span className="text-xs text-gray-500 block">Date & Time</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(latestInterview.interviewDate)} ({latestInterview.timeZone || 'UTC'})
                </span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-purple-100">
                <span className="text-xs text-gray-500 block">Format & Duration</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {latestInterview.duration} Mins • {latestInterview.interviewType}
                </span>
              </div>
            </div>

            {latestInterview.instructions && (
              <div className="bg-white/90 p-3 rounded-xl border border-purple-100 mb-3 text-xs text-gray-700">
                <span className="font-bold block text-gray-900 mb-0.5">Recruiter Instructions:</span>
                {latestInterview.instructions}
              </div>
            )}

            {latestInterview.interviewType === 'online' && latestInterview.meetingUrl && (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <Video className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="text-xs text-gray-600 truncate font-mono">
                    {latestInterview.meetingUrl}
                  </span>
                </div>
                <a
                  href={latestInterview.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Join Interview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* 3. Recruiter Feedback Card */}
        {application.feedback && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Hiring Team Feedback</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              "{application.feedback}"
            </p>
          </div>
        )}

        {/* 4. Complete Chronological Event History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Chronological Activity Trail
            </h4>
            <span className="text-[11px] text-gray-400">
              {history.length} recorded event{history.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-3">
            {history.length > 0 ? (
              history
                .slice()
                .reverse()
                .map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-sm"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-gray-900 text-xs">
                          {event.status}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatDate(event.changedAt)}
                        </span>
                      </div>

                      {event.notes && (
                        <p className="text-xs text-gray-600 mt-0.5">{event.notes}</p>
                      )}

                      {event.feedback && (
                        <p className="text-xs text-purple-700 bg-purple-50/80 p-2 rounded-lg border border-purple-100 mt-1 mb-1">
                          <strong>Feedback:</strong> {event.feedback}
                        </p>
                      )}

                      {event.changedBy?.fullname && (
                        <span className="text-[10px] text-gray-400 block mt-1">
                          Updated by {event.changedBy.fullname}
                        </span>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Application submitted on {formatDate(application.createdAt)}. Waiting for initial hiring team review.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ApplicationTimelineDialog
