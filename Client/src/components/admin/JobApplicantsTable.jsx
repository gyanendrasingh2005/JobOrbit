import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
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
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import {
  MoreHorizontal,
  Calendar,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CalendarPlus,
  Ban,
  RotateCcw,
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'sonner'
import axios from 'axios'
import { APPLICANT_API_END_POINT, INTERVIEW_API_END_POINT, resolveResumeUrl } from '@/utils/constant'
import { setAllApplicants } from '@/redux/applicationSlice'
import ApplicationTimelineDialog, { getStatusBadgeColor } from '../ApplicationTimelineDialog'
import ScheduleInterviewDialog from './ScheduleInterviewDialog'
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

const JobApplicantsTable = () => {
  const dispatch = useDispatch()
  const { allApplicants } = useSelector(store => store.application)

  // Dialog states
  const [timelineApp, setTimelineApp] = useState(null)
  const [timelineOpen, setTimelineOpen] = useState(false)

  const [scheduleApp, setScheduleApp] = useState(null)
  const [existingInterview, setExistingInterview] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  // Stage change with feedback dialog state
  const [stageTarget, setStageTarget] = useState(null) // { application, targetStage }
  const [stageFeedback, setStageFeedback] = useState('')
  const [updatingStage, setUpdatingStage] = useState(false)

  // Internal Notes Dialog
  const [notesApp, setNotesApp] = useState(null)
  const [notesText, setNotesText] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  // Cancel Interview Dialog
  const [cancelInterviewTarget, setCancelInterviewTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Candidate Action & Email Confirmation Modal State
  const [candidateActionTarget, setCandidateActionTarget] = useState(null) // { application, actionType }
  const [candidateActionOpen, setCandidateActionOpen] = useState(false)

  const handleOpenCandidateAction = (application, actionType) => {
    setCandidateActionTarget({ application, actionType })
    setCandidateActionOpen(true)
  }

  const handleCandidateActionSuccess = (updatedApp) => {
    if (allApplicants?.applications && updatedApp) {
      const updatedApps = allApplicants.applications.map((app) =>
        app._id === updatedApp._id ? { ...app, ...updatedApp } : app
      )
      dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }))
    }
  }

  // Retry Failed Email Notification
  const handleRetryEmail = async (applicationId) => {
    try {
      toast.loading('Retrying email delivery...', { id: 'retry-email' })
      const res = await axios.post(
        `${APPLICANT_API_END_POINT}/${applicationId}/retry-email`,
        {},
        { withCredentials: true }
      )
      if (res.data.success) {
        toast.success(res.data.message || 'Notification email dispatched successfully!', { id: 'retry-email' })
        if (allApplicants?.applications) {
          const updatedApps = allApplicants.applications.map((app) =>
            app._id === applicationId
              ? { ...app, lastEmailError: null, lastEmailSentAt: new Date() }
              : app
          )
          dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }))
        }
      } else {
        toast.error(res.data.message || 'Email delivery failed', { id: 'retry-email', duration: 8000 })
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Email retry failed',
        { id: 'retry-email', duration: 8000 }
      )
    }
  }

  // 1. Update Candidate Status with optional feedback
  const statusHandler = async (status, applicationId, feedback = '') => {
    try {
      setUpdatingStage(true)
      const response = await axios.post(
        `${APPLICANT_API_END_POINT}/status/${applicationId}/update`,
        { status, feedback },
        { withCredentials: true }
      )

      if (response.data.success) {
        toast.success(response.data.message)

        // Optimistically update application in Redux state
        if (allApplicants?.applications) {
          const updatedApps = allApplicants.applications.map((app) => {
            if (app._id === applicationId) {
              return {
                ...app,
                status: response.data.application?.status || status,
                feedback: feedback || app.feedback,
                statusHistory: response.data.application?.statusHistory || app.statusHistory,
              }
            }
            return app
          })
          dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }))
        }
        setStageTarget(null)
        setStageFeedback('')
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingStage(false)
    }
  }

  // 2. Open Schedule Modal
  const handleOpenSchedule = (application, interview = null) => {
    setScheduleApp(application)
    setExistingInterview(interview)
    setScheduleOpen(true)
  }

  // 3. Callback when interview is scheduled/rescheduled
  const handleInterviewScheduled = (updatedInterview) => {
    if (allApplicants?.applications && scheduleApp) {
      const updatedApps = allApplicants.applications.map((app) => {
        if (app._id === scheduleApp._id) {
          const currentInterviews = app.interviews || []
          const exists = currentInterviews.some((i) => i._id === updatedInterview._id)
          const newInterviews = exists
            ? currentInterviews.map((i) => (i._id === updatedInterview._id ? updatedInterview : i))
            : [...currentInterviews, updatedInterview]

          return {
            ...app,
            status: 'Interview Scheduled',
            interviews: newInterviews,
          }
        }
        return app
      })
      dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }))
    }
  }

  // 4. Cancel Interview
  const handleCancelInterview = async () => {
    if (!cancelInterviewTarget) return
    try {
      setCancelling(true)
      const res = await axios.put(
        `${INTERVIEW_API_END_POINT}/${cancelInterviewTarget.interview._id}/cancel`,
        { reason: 'Cancelled by recruiter' },
        { withCredentials: true }
      )

      if (res.data.success) {
        toast.success('Interview cancelled and notification dispatched.')
        // Update in Redux
        if (allApplicants?.applications) {
          const updatedApps = allApplicants.applications.map((app) => {
            if (app._id === cancelInterviewTarget.applicationId) {
              return {
                ...app,
                interviews: (app.interviews || []).map((i) =>
                  i._id === cancelInterviewTarget.interview._id ? { ...i, status: 'Cancelled' } : i
                ),
              }
            }
            return app
          })
          dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }))
        }
        setCancelInterviewTarget(null)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to cancel interview')
    } finally {
      setCancelling(false)
    }
  }

  // 5. Save Internal Notes
  const handleSaveNotes = async () => {
    if (!notesApp) return
    try {
      setSavingNotes(true)
      const response = await axios.post(
        `${APPLICANT_API_END_POINT}/status/${notesApp._id}/update`,
        { status: notesApp.status, notes: notesText },
        { withCredentials: true }
      )

      if (response.data.success) {
        toast.success('Candidate internal notes saved!')
        if (allApplicants?.applications) {
          const updatedApps = allApplicants.applications.map((app) =>
            app._id === notesApp._id ? { ...app, internalNotes: notesText } : app
          )
          dispatch(setAllApplicants({ ...allApplicants, applications: updatedApps }))
        }
        setNotesOpen(false)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
      <Table>
        <TableCaption className="py-4 text-xs text-gray-400">
          Showing {allApplicants?.applications?.length || 0} candidate applications for this job position
        </TableCaption>
        <TableHeader className="bg-gray-50/70">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">Candidate</TableHead>
            <TableHead className="font-semibold text-gray-700">Contact</TableHead>
            <TableHead className="font-semibold text-gray-700">Resume</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="font-semibold text-gray-700">Interview</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!allApplicants?.applications || allApplicants.applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                No applicants have applied to this position yet.
              </TableCell>
            </TableRow>
          ) : (
            allApplicants.applications.map((item) => {
              const latestInterview =
                item?.interviews && item.interviews.length > 0
                  ? item.interviews[item.interviews.length - 1]
                  : null

              const hasActiveInterview =
                latestInterview && latestInterview.status !== 'Cancelled'

              return (
                <TableRow key={item._id} className="hover:bg-purple-50/20 transition-colors">
                  {/* Candidate Profile */}
                  <TableCell>
                    <div className="font-semibold text-gray-900 text-sm">
                      {item?.applicant?.fullname || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">{item?.applicant?.email}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Applied: {item?.createdAt ? item.createdAt.split('T')[0] : 'N/A'}
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell className="text-xs text-gray-600 font-mono">
                    {item?.applicant?.phoneNumber || 'N/A'}
                  </TableCell>

                  {/* Resume Link */}
                  <TableCell>
                    {item?.applicant?.profile?.resume ? (
                      <a
                        href={resolveResumeUrl(item.applicant.profile.resume)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[110px]">
                          {item.applicant.profile.resumeOriginalName || 'View Resume'}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No resume</span>
                    )}
                  </TableCell>

                  {/* Current Status Badge */}
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge className={`${getStatusBadgeColor(item?.status)} px-2.5 py-0.5 text-xs font-semibold border`}>
                        {(item?.status || 'Applied').toUpperCase()}
                      </Badge>
                      {item?.lastEmailError && (
                        <button
                          type="button"
                          onClick={() => handleRetryEmail(item._id)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                          title={`Email error: ${item.lastEmailError}. Click to retry.`}
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Retry Email</span>
                        </button>
                      )}
                    </div>
                  </TableCell>

                  {/* Scheduled Interview Info */}
                  <TableCell>
                    {hasActiveInterview ? (
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md w-fit">
                          <Calendar className="w-3 h-3" />
                          <span>
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
                              className="text-purple-600 hover:text-purple-800 font-semibold underline"
                            >
                              Join Call
                            </a>
                          ) : (
                            <span className="text-gray-500 capitalize">{latestInterview.interviewType}</span>
                          )}
                          <button
                            onClick={() => handleOpenSchedule(item, latestInterview)}
                            className="text-gray-500 hover:text-purple-600 font-medium cursor-pointer"
                            title="Reschedule interview"
                          >
                            Reschedule
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleOpenSchedule(item)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs font-semibold text-purple-600 border-purple-200 hover:bg-purple-50 rounded-lg gap-1 cursor-pointer"
                      >
                        <CalendarPlus className="w-3 h-3" />
                        <span>Schedule</span>
                      </Button>
                    )}
                  </TableCell>

                  {/* Action Menu */}
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
                          <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                          <span>Move to Next Round</span>
                        </div>

                        {/* 3. Schedule Interview */}
                        <div
                          onClick={() => handleOpenSchedule(item, hasActiveInterview ? latestInterview : null)}
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
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
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
                            onClick={() => setStageTarget({ application: item, targetStage: stage.value, stageLabel: stage.label })}
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
                            onClick={() =>
                              setCancelInterviewTarget({
                                interview: latestInterview,
                                applicationId: item._id,
                              })
                            }
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

      {/* Visual Timeline Dialog */}
      <ApplicationTimelineDialog
        open={timelineOpen}
        setOpen={setTimelineOpen}
        application={timelineApp}
      />

      {/* Schedule / Reschedule Dialog */}
      <ScheduleInterviewDialog
        open={scheduleOpen}
        setOpen={setScheduleOpen}
        application={scheduleApp}
        existingInterview={existingInterview}
        onSuccess={handleInterviewScheduled}
      />

      {/* Recruiter Functional Candidate Action & Email Dialog */}
      <CandidateActionModal
        open={candidateActionOpen}
        onOpenChange={setCandidateActionOpen}
        application={candidateActionTarget?.application}
        actionType={candidateActionTarget?.actionType}
        onSuccess={handleCandidateActionSuccess}
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
              placeholder="e.g. Strong system design knowledge, follow up with references..."
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

      {/* Cancel Interview Confirmation Dialog */}
      <Dialog open={Boolean(cancelInterviewTarget)} onOpenChange={() => setCancelInterviewTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Cancel Scheduled Interview
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 pt-1">
              Are you sure you want to cancel this interview? An automated cancellation notification will be emailed to the candidate and future reminders will be cancelled.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelInterviewTarget(null)}
              className="rounded-xl text-xs"
            >
              Keep Interview
            </Button>
            <Button
              size="sm"
              onClick={handleCancelInterview}
              disabled={cancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Transition Dialog with Candidate Feedback */}
      <Dialog open={Boolean(stageTarget)} onOpenChange={() => setStageTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Advance Candidate • {stageTarget?.stageLabel}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 pt-1">
              Move candidate <strong>{stageTarget?.application?.applicant?.fullname}</strong> to stage <strong>{stageTarget?.targetStage}</strong>. An automated status notification will be sent to their email.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Feedback / Instructions for Candidate (Optional)
            </label>
            <Textarea
              rows={3}
              value={stageFeedback}
              onChange={(e) => setStageFeedback(e.target.value)}
              placeholder="e.g. Cleared round 1 technical interview, advancing to system design review..."
              className="rounded-xl border-gray-200 text-xs"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              This feedback will be stored with the application and displayed on the candidate's dashboard and email.
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
              onClick={() => statusHandler(stageTarget.targetStage, stageTarget.application._id, stageFeedback)}
              disabled={updatingStage}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs"
            >
              {updatingStage ? 'Updating...' : `Confirm • ${stageTarget?.targetStage}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JobApplicantsTable
