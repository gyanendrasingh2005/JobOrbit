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
import { toast } from 'sonner'
import axios from 'axios'
import { INTERVIEW_API_END_POINT } from '@/utils/constant'
import { Loader2, Calendar, Video, MapPin, Clock, Globe, Mail } from 'lucide-react'

const ScheduleInterviewDialog = ({
  open,
  setOpen,
  application,
  existingInterview = null,
  onSuccess,
}) => {
  const isReschedule = Boolean(existingInterview)

  // Default to user's local timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  const jobTitle = application?.job?.title || 'the position'
  const companyName = application?.job?.company?.companyName || 'the hiring team'

  const [formData, setFormData] = useState({
    interviewDate: '',
    timeZone: userTimeZone,
    duration: 45,
    roundNumber: 1,
    interviewType: 'online',
    meetingUrl: '',
    location: '',
    instructions: '',
    customSubject: '',
    customMessage: '',
  })

  const [loading, setLoading] = useState(false)
  const [showEmailCustomizer, setShowEmailCustomizer] = useState(false)

  // Minimum allowed date string for datetime-local (now)
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  useEffect(() => {
    const defaultSubject = `Interview Scheduled for ${jobTitle} at ${companyName}`
    if (existingInterview) {
      let dateVal = ''
      try {
        const d = new Date(existingInterview.interviewDate)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        dateVal = d.toISOString().slice(0, 16)
      } catch {
        dateVal = ''
      }

      setFormData({
        interviewDate: dateVal,
        timeZone: existingInterview.timeZone || userTimeZone,
        duration: existingInterview.duration || 45,
        roundNumber: existingInterview.roundNumber || 1,
        interviewType: existingInterview.interviewType || 'online',
        meetingUrl: existingInterview.meetingUrl || '',
        location: existingInterview.location || '',
        instructions: existingInterview.instructions || '',
        customSubject: defaultSubject,
        customMessage: '',
      })
    } else {
      // Default initial date: tomorrow at 10:00 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset())

      setFormData({
        interviewDate: tomorrow.toISOString().slice(0, 16),
        timeZone: userTimeZone,
        duration: 45,
        roundNumber: 1,
        interviewType: 'online',
        meetingUrl: '',
        location: '',
        instructions: '',
        customSubject: defaultSubject,
        customMessage: '',
      })
    }
  }, [existingInterview, open, jobTitle, companyName])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.interviewDate) {
      toast.error('Please select an interview date and time')
      return
    }

    const selectedTime = new Date(formData.interviewDate).getTime()
    if (selectedTime <= Date.now()) {
      toast.error('Interview time cannot be in the past')
      return
    }

    if (formData.interviewType === 'online') {
      if (!formData.meetingUrl.trim()) {
        toast.error('Please provide a meeting link (Google Meet, Zoom, Teams, etc.)')
        return
      }
      if (!/^https?:\/\//i.test(formData.meetingUrl.trim())) {
        toast.error('Meeting URL must start with http:// or https://')
        return
      }
    } else {
      if (!formData.location.trim()) {
        toast.error('Please provide an in-person interview location or address')
        return
      }
    }

    try {
      setLoading(true)

      let res
      if (isReschedule) {
        res = await axios.put(
          `${INTERVIEW_API_END_POINT}/${existingInterview._id}/reschedule`,
          {
            newDate: new Date(formData.interviewDate).toISOString(),
            timeZone: formData.timeZone,
            duration: Number(formData.duration),
            roundNumber: Number(formData.roundNumber) || 1,
            meetingUrl: formData.meetingUrl,
            location: formData.location,
            instructions: formData.instructions,
            customSubject: formData.customSubject,
            customMessage: formData.customMessage,
          },
          { withCredentials: true }
        )
      } else {
        res = await axios.post(
          `${INTERVIEW_API_END_POINT}/schedule`,
          {
            applicationId: application._id,
            interviewDate: new Date(formData.interviewDate).toISOString(),
            timeZone: formData.timeZone,
            duration: Number(formData.duration),
            roundNumber: Number(formData.roundNumber) || 1,
            interviewType: formData.interviewType,
            meetingUrl: formData.meetingUrl,
            location: formData.location,
            instructions: formData.instructions,
            customSubject: formData.customSubject,
            customMessage: formData.customMessage,
          },
          { withCredentials: true }
        )
      }

      if (res.data.success) {
        toast.success(res.data.message || 'Interview scheduled successfully!')
        setOpen(false)
        if (onSuccess) onSuccess(res.data.interview)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to save interview')
    } finally {
      setLoading(false)
    }
  }

  const candidateName =
    application?.applicant?.fullname || application?.candidate?.fullname || 'Candidate'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              {isReschedule ? 'Reschedule Session' : 'Interview Scheduler'}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {isReschedule ? 'Reschedule Interview' : `Schedule Interview with ${candidateName}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            An automated branded email invitation with full details will be dispatched to the candidate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* Round & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Hiring Round
              </Label>
              <select
                name="roundNumber"
                value={formData.roundNumber}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-400"
              >
                <option value={1}>Round 1 (Technical Screening)</option>
                <option value={2}>Round 2 (Deep Dive / System Design)</option>
                <option value={3}>Round 3 (Leadership / Culture Fit)</option>
                <option value={4}>Round 4 (Final Round)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                Interview Date & Time
              </Label>
              <Input
                type="datetime-local"
                name="interviewDate"
                min={getMinDateTime()}
                value={formData.interviewDate}
                onChange={handleChange}
                required
                className="rounded-xl border-gray-200 text-xs h-10"
              />
            </div>
          </div>

          {/* Timezone and Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                Time Zone
              </Label>
              <Input
                type="text"
                name="timeZone"
                value={formData.timeZone}
                onChange={handleChange}
                placeholder="e.g. UTC, Asia/Kolkata"
                className="rounded-xl border-gray-200 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Duration (Mins)
              </Label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-400"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes</option>
              </select>
            </div>
          </div>

          {/* Format: Online vs In-person */}
          <div>
            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Interview Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, interviewType: 'online' }))}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  formData.interviewType === 'online'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Online Video</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, interviewType: 'in-person' }))}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  formData.interviewType === 'in-person'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>In-Person</span>
              </button>
            </div>
          </div>

          {/* Conditional Meeting Link or Location */}
          {formData.interviewType === 'online' ? (
            <div>
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Video className="w-3.5 h-3.5 text-purple-600" />
                Meeting URL
              </Label>
              <Input
                type="url"
                name="meetingUrl"
                placeholder="https://meet.google.com/xyz or Zoom link"
                value={formData.meetingUrl}
                onChange={handleChange}
                required
                className="rounded-xl border-gray-200 text-xs font-mono"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Provide a valid video meeting URL for the candidate to join.
              </span>
            </div>
          ) : (
            <div>
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Office Location / Room
              </Label>
              <Input
                type="text"
                name="location"
                placeholder="e.g. Building 4, Conference Room B, 123 Tech Park"
                value={formData.location}
                onChange={handleChange}
                required
                className="rounded-xl border-gray-200 text-xs"
              />
            </div>
          )}

          {/* Candidate Preparation Instructions */}
          <div>
            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Instructions for Candidate (Optional)
            </Label>
            <Textarea
              name="instructions"
              placeholder="e.g. Please prepare a 5-minute walkthrough of your recent project..."
              value={formData.instructions}
              onChange={handleChange}
              rows={2}
              className="rounded-xl border-gray-200 text-xs"
            />
          </div>

          {/* Email Subject & Preview Customization */}
          <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                Email Notification Details
              </span>
              <button
                type="button"
                onClick={() => setShowEmailCustomizer(!showEmailCustomizer)}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                {showEmailCustomizer ? 'Hide Email Options' : 'Customize Email'}
              </button>
            </div>

            {showEmailCustomizer ? (
              <div className="space-y-2 pt-1">
                <div>
                  <Label className="text-[11px] font-semibold text-gray-700 mb-1 block">Email Subject</Label>
                  <Input
                    type="text"
                    name="customSubject"
                    value={formData.customSubject}
                    onChange={handleChange}
                    placeholder="Interview Scheduled..."
                    className="rounded-xl border-gray-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-gray-700 mb-1 block">Custom Message / Notes for Email Body</Label>
                  <Textarea
                    name="customMessage"
                    value={formData.customMessage}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Add custom introductory text or instructions for the email invitation..."
                    className="rounded-xl border-gray-200 text-xs bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">
                Subject: <span className="font-medium text-gray-800">{formData.customSubject || `Interview Scheduled for ${jobTitle} at ${companyName}`}</span>
              </p>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isReschedule ? 'Confirm Reschedule' : 'Schedule & Send Invite'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleInterviewDialog
