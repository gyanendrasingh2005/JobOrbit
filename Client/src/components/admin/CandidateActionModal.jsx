import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import axios from 'axios'
import { APPLICANT_API_END_POINT } from '@/utils/constant'
import { getStatusBadgeColor } from '../ApplicationTimelineDialog'
import {
  Mail,
  Send,
  Sparkles,
  ArrowRight,
  Eye,
  Edit3,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Building,
  User,
  Briefcase,
  Layers,
  Info,
} from 'lucide-react'

// Available rounds for "Move to Next Round" action
export const SUPPORTED_NEXT_ROUNDS = [
  { label: 'Round 2 (Technical / Deep Dive)', value: 'Round 2', status: 'Shortlisted — Round 2' },
  { label: 'Round 3 (System Design / Managerial)', value: 'Round 3', status: 'Shortlisted — Round 3' },
  { label: 'Technical Interview', value: 'Technical Interview', status: 'Shortlisted — Round 2' },
  { label: 'HR Interview', value: 'HR Interview', status: 'Shortlisted — Round 3' },
]

/**
 * Standard Email Templates (A, B, D, E)
 */
export const getDefaultTemplates = ({ actionType, candidateName, jobTitle, companyName, roundName }) => {
  const safeName = candidateName || 'Candidate'
  const safeJob = jobTitle || 'the position'
  const safeCompany = companyName || 'the hiring team'
  const safeRound = roundName || 'Round 2'

  switch (actionType) {
    case 'shortlist':
      return {
        targetStatus: 'Shortlisted — Round 1',
        roundName: 'Round 1',
        subject: `Congratulations! You Have Been Shortlisted for ${safeJob}`,
        message: `Dear ${safeName}, congratulations! Your application for ${safeJob} at ${safeCompany} has been shortlisted. We will share the next steps with you soon.`,
      }

    case 'next_round':
      return {
        targetStatus: safeRound.includes('3') || safeRound.includes('HR') ? 'Shortlisted — Round 3' : 'Shortlisted — Round 2',
        roundName: safeRound,
        subject: `Congratulations! You Have Advanced to ${safeRound} — ${safeJob}`,
        message: `Dear ${safeName}, congratulations! You have successfully advanced to ${safeRound} for the ${safeJob} position at ${safeCompany}. Please check your applicant dashboard for further details.`,
      }

    case 'select':
      return {
        targetStatus: 'Selected',
        roundName: 'Offer & Selection',
        subject: `Congratulations! You Have Been Selected for ${safeJob}`,
        message: `Dear ${safeName}, congratulations! We are pleased to inform you that you have been selected for ${safeJob} at ${safeCompany}. Please check your dashboard for the next steps.`,
      }

    case 'reject':
      return {
        targetStatus: 'Rejected',
        roundName: '',
        subject: `Update on Your Application for ${safeJob}`,
        message: `Dear ${safeName}, thank you for applying for ${safeJob} at ${safeCompany}. After careful consideration, we will not be proceeding with your application at this time. We appreciate your interest and wish you the best in your job search.`,
      }

    default:
      return {
        targetStatus: 'Under Review',
        roundName: '',
        subject: `Update on Your Application for ${safeJob}`,
        message: `Dear ${safeName}, your application for ${safeJob} at ${safeCompany} has been updated. Please log in to your dashboard for details.`,
      }
  }
}

const CandidateActionModal = ({
  open,
  onOpenChange,
  application,
  actionType, // 'shortlist' | 'next_round' | 'select' | 'reject'
  onSuccess,
}) => {
  const candidateName = application?.applicant?.fullname || 'Candidate'
  const candidateEmail = application?.applicant?.email || 'N/A'
  const jobTitle = application?.job?.title || 'Job Position'
  const companyName = application?.job?.company?.companyName || 'Hiring Company'
  const currentStatus = application?.status || 'Applied'

  // Dynamically resolve supported rounds based on recruiter's job configuration
  const availableRounds = (() => {
    const job = application?.job
    if (job?.interviewRounds && Array.isArray(job.interviewRounds) && job.interviewRounds.length > 0) {
      return job.interviewRounds.map((r, i) => {
        const num = r.roundNumber || i + 1
        const name = r.name || `Round ${num}`
        return {
          label: name,
          value: `Round ${num}`,
          status: `Shortlisted — Round ${num}`,
        }
      })
    }
    if (job?.totalRounds && Number(job.totalRounds) > 0) {
      return Array.from({ length: Number(job.totalRounds) }, (_, i) => ({
        label: `Round ${i + 1}`,
        value: `Round ${i + 1}`,
        status: `Shortlisted — Round ${i + 1}`,
      }))
    }
    return SUPPORTED_NEXT_ROUNDS
  })()

  // Modal internal states
  const [selectedRound, setSelectedRound] = useState(availableRounds[1]?.value || availableRounds[0]?.value || 'Round 2')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [candidateFeedback, setCandidateFeedback] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [sendEmailNotification, setSendEmailNotification] = useState(true)
  const [activeTab, setActiveTab] = useState('edit') // 'edit' | 'preview'
  const [submitting, setSubmitting] = useState(false)

  // Sync templates on open or actionType/round change
  useEffect(() => {
    if (open && application) {
      const initialRound =
        currentStatus.includes('Round 2') ? 'Round 3' : 'Round 2'
      setSelectedRound(initialRound)

      const def = getDefaultTemplates({
        actionType,
        candidateName,
        jobTitle,
        companyName,
        roundName: initialRound,
      })

      setEmailSubject(def.subject)
      setEmailMessage(def.message)
      setCandidateFeedback(application.feedback || '')
      setInternalNotes(application.internalNotes || '')
      setSendEmailNotification(true)
      setActiveTab('edit')
    }
  }, [open, actionType, application])

  // Handle round change for "next_round" action
  const handleRoundChange = (round) => {
    setSelectedRound(round)
    const def = getDefaultTemplates({
      actionType: 'next_round',
      candidateName,
      jobTitle,
      companyName,
      roundName: round,
    })
    setEmailSubject(def.subject)
    setEmailMessage(def.message)
  }

  // Reset to default template
  const handleResetDefaults = () => {
    const def = getDefaultTemplates({
      actionType,
      candidateName,
      jobTitle,
      companyName,
      roundName: selectedRound,
    })
    setEmailSubject(def.subject)
    setEmailMessage(def.message)
    toast.info('Template reset to default wording')
  }

  // Calculate current target status
  const currentDefaults = getDefaultTemplates({
    actionType,
    candidateName,
    jobTitle,
    companyName,
    roundName: selectedRound,
  })
  const targetStatus = currentDefaults.targetStatus

  // Submit Handler
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const payload = {
        status: targetStatus,
        roundName: actionType === 'next_round' ? selectedRound : undefined,
        customSubject: emailSubject.trim(),
        customMessage: emailMessage.trim(),
        feedback: candidateFeedback.trim(),
        notes: internalNotes.trim(),
        sendEmail: sendEmailNotification,
      }

      const res = await axios.post(
        `${APPLICANT_API_END_POINT}/status/${application._id}/update`,
        payload,
        { withCredentials: true }
      )

      if (res.data.success) {
        if (res.data.emailSent) {
          toast.success(res.data.message || 'Status updated & email sent!')
        } else if (res.data.emailError) {
          toast.warning(`Status updated, but email could not be delivered: ${res.data.emailError}`)
        } else {
          toast.success(res.data.message || 'Status updated successfully!')
        }

        if (onSuccess) {
          onSuccess(res.data.application)
        }
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Update Candidate Status Error:', error)
      toast.error(error.response?.data?.message || 'Failed to update candidate status')
    } finally {
      setSubmitting(false)
    }
  }

  // Action title & badge color
  const getActionHeader = () => {
    switch (actionType) {
      case 'shortlist':
        return {
          title: 'Shortlist Candidate',
          accent: 'text-amber-600',
          bgAccent: 'bg-amber-50',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        }
      case 'next_round':
        return {
          title: 'Move to Next Round',
          accent: 'text-purple-600',
          bgAccent: 'bg-purple-50',
          buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
        }
      case 'select':
        return {
          title: 'Select Candidate (Job Offer)',
          accent: 'text-emerald-600',
          bgAccent: 'bg-emerald-50',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        }
      case 'reject':
        return {
          title: 'Reject Application',
          accent: 'text-rose-600',
          bgAccent: 'bg-rose-50',
          buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white',
        }
      default:
        return {
          title: 'Update Candidate Stage',
          accent: 'text-blue-600',
          bgAccent: 'bg-blue-50',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        }
    }
  }

  if (!application) return null;

  const actionInfo = getActionHeader()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${actionInfo.bgAccent} ${actionInfo.accent}`}
            >
              Recruiter Action • {actionInfo.title}
            </span>

            {/* View Mode Toggle: Edit vs Preview */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Compose</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-purple-700 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Email Preview</span>
              </button>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-gray-900">
            {actionInfo.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Update stage in MongoDB and send a personalized transactional email to the candidate.
          </DialogDescription>
        </DialogHeader>

        {/* Candidate & Job Summary Card */}
        <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 border border-gray-200/70 rounded-2xl p-4 my-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="text-gray-500 block text-[11px]">Candidate</span>
                <span className="font-semibold text-gray-900">{candidateName}</span>
                <span className="text-gray-400 block text-[11px] truncate">{candidateEmail}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="text-gray-500 block text-[11px]">Position & Company</span>
                <span className="font-semibold text-gray-900 truncate block">{jobTitle}</span>
                <span className="text-gray-500 block text-[11px]">{companyName}</span>
              </div>
            </div>
          </div>

          {/* Status Progression Bar */}
          <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[11px]">Current Status:</span>
              <Badge className={`${getStatusBadgeColor(currentStatus)} px-2 py-0.5 text-[11px] font-semibold border`}>
                {currentStatus}
              </Badge>
            </div>

            <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />

            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[11px]">New Status:</span>
              <Badge className={`${getStatusBadgeColor(targetStatus)} px-2.5 py-0.5 text-xs font-bold border shadow-xs`}>
                {targetStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Move to Next Round selector */}
        {actionType === 'next_round' && (
          <div className="my-2 bg-purple-50/50 border border-purple-100 rounded-2xl p-3.5">
            <Label className="text-xs font-bold text-purple-900 flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Select Next Round Supported by JobOrbit
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableRounds.map((rnd) => (
                <button
                  key={rnd.value}
                  type="button"
                  onClick={() => handleRoundChange(rnd.value)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                    selectedRound === rnd.value
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50/60'
                  }`}
                >
                  <span className="block truncate font-medium">{rnd.label || rnd.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Compose / Edit Form */}
        {activeTab === 'edit' && (
          <div className="space-y-3.5 my-2">
            {/* Email Subject */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  Email Subject
                </Label>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium cursor-pointer"
                  title="Reset to default wording"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
              <Input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="rounded-xl border-gray-200 text-xs font-medium"
              />
            </div>

            {/* Email Message */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                Notification Message Body
              </Label>
              <Textarea
                rows={4}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Type your message to candidate..."
                className="rounded-xl border-gray-200 text-xs leading-relaxed"
              />
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                Default template pre-populated. You may edit or add custom remarks before sending.
              </span>
            </div>

            {/* Optional Candidate Feedback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Public Feedback (Visible to Candidate)
                </Label>
                <Input
                  type="text"
                  value={candidateFeedback}
                  onChange={(e) => setCandidateFeedback(e.target.value)}
                  placeholder="e.g. Cleared technical screening..."
                  className="rounded-xl border-gray-200 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Private Internal Notes (Recruiter Only)
                </Label>
                <Input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Candidate requested 2 weeks notice..."
                  className="rounded-xl border-gray-200 text-xs"
                />
              </div>
            </div>

            {/* Send Email Checkbox */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="sendEmailCheckbox"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
              />
              <label
                htmlFor="sendEmailCheckbox"
                className="text-xs text-gray-700 font-medium cursor-pointer"
              >
                Send automated email notification to candidate ({candidateEmail})
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Realistic Email Preview */}
        {activeTab === 'preview' && (
          <div className="my-2 border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white text-xs">
            {/* Email Client Header Bar */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-gray-500 text-[11px]">
                <span className="font-semibold text-gray-700">From: JobOrbit Careers &lt;no-reply@joborbit.com&gt;</span>
                <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  GMAIL OAUTH2
                </span>
              </div>
              <div className="text-gray-700">
                <span className="text-gray-400">To: </span>
                <span className="font-medium text-gray-900">{candidateName} &lt;{candidateEmail}&gt;</span>
              </div>
              <div className="text-gray-900 font-semibold pt-0.5">
                <span className="text-gray-400 font-normal">Subject: </span>
                {emailSubject || '(No Subject)'}
              </div>
            </div>

            {/* Branded Email Content */}
            <div className="p-5 max-w-md mx-auto my-3 bg-white border border-gray-100 rounded-xl shadow-xs">
              {/* JobOrbit Brand Banner */}
              <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 rounded-xl text-center text-white mb-4">
                <div className="text-lg font-black tracking-tight">Job<span className="text-purple-200">Orbit</span></div>
                <div className="text-[10px] text-purple-200">Elevating your career trajectory</div>
              </div>

              {/* Email Body */}
              <div className="text-gray-800 space-y-3 leading-relaxed">
                <h4 className="font-bold text-sm text-gray-900">Application Status Update</h4>
                <p className="whitespace-pre-line text-xs text-gray-700">{emailMessage}</p>

                {/* Info Card in Email */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Position:</span>
                    <span className="font-semibold text-gray-800">{jobTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company:</span>
                    <span className="font-semibold text-gray-800">{companyName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Current Stage:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeColor(targetStatus)}`}>
                      {targetStatus}
                    </span>
                  </div>
                  {candidateFeedback && (
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="text-gray-500">Feedback:</span>
                      <span className="font-medium text-purple-700">{candidateFeedback}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2">
                  <span className="inline-block bg-purple-600 text-white font-semibold text-[11px] px-4 py-2 rounded-lg shadow-xs">
                    View in JobOrbit Dashboard
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 text-center text-[10px] text-gray-400">
                © {new Date().getFullYear()} JobOrbit Inc. All rights reserved.
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className={`rounded-xl text-xs font-semibold gap-1.5 ${actionInfo.buttonClass}`}
          >
            {submitting ? (
              <span>Updating Status...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendEmailNotification
                    ? `Confirm & Send Email (${targetStatus})`
                    : `Confirm Status (${targetStatus})`}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CandidateActionModal
