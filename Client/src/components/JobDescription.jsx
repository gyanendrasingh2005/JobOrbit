import React, { useEffect, useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { APPLICANT_API_END_POINT, JOB_API_END_POINT, USER_API_END_POINT } from '@/utils/constant'
import { setSingleJob } from '@/redux/jobSlice'
import { setBookmarks } from '@/redux/authSlice'
import { toast } from 'sonner'
import Navbar from './shared/Navbar'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bookmark, Loader2 } from 'lucide-react'

// Custom markdown components for rich formatting
// Custom markdown components for rich, distinct formatting
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-[#7209b7]/30 tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <div className="mt-8 first:mt-1 mb-4 pt-2">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5 pb-2.5 border-b border-gray-200">
        <span className="w-1.5 h-6 bg-[#7209b7] rounded-full inline-block shrink-0 shadow-xs"></span>
        <span className="tracking-tight">{children}</span>
      </h2>
    </div>
  ),
  h3: ({ children }) => (
    <div className="mt-6 mb-2.5">
      <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#7209b7] inline-block shrink-0"></span>
        <span>{children}</span>
      </h3>
    </div>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-1">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed mb-3.5 text-[15px]">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 space-y-2 pl-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-6 my-3 space-y-2 text-gray-700 text-[15px]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-gray-700">
      <span className="text-[#7209b7] font-bold mt-1 shrink-0 text-base leading-none">•</span>
      <div className="flex-1">{children}</div>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-700">
      {children}
    </em>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto my-3 text-xs font-mono">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isMultiLine = typeof children === 'string' && children.includes('\n')
    const hasLang = Boolean(className && className.includes('language-'))
    if (isMultiLine || hasLang) {
      return <code className={className}>{children}</code>
    }
    return (
      <span className="inline-flex items-center bg-purple-50 text-[#7209b7] border border-purple-200 font-semibold text-xs px-2.5 py-1 rounded-md mr-1.5 mb-1.5 shadow-2xs">
        {children}
      </span>
    )
  },
  blockquote: ({ children }) => (
    <div className="border-l-4 border-amber-500 bg-amber-50/80 rounded-r-xl p-4 my-4 text-amber-900 text-sm shadow-xs leading-relaxed">
      {children}
    </div>
  ),
  hr: () => <hr className="border-gray-200 my-6" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#7209b7] font-medium underline underline-offset-2 hover:text-purple-900"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-gray-200 rounded-lg text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 text-gray-700 font-semibold">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-t border-gray-200 even:bg-gray-50">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-gray-700">{children}</td>
  ),
}

// Normalizes plain-text descriptions into structured markdown with clear headings, subheadings, and lists.
const normalizeDescription = (raw) => {
  if (!raw || typeof raw !== 'string') return ''

  let text = raw.trim()

  // If text already has well-structured markdown (multiple ## and -), preserve it
  const hasMarkdownStructure = /^(##|###)\s+\S+/m.test(text) && /^\s*[-*]\s+\S+/m.test(text)
  if (hasMarkdownStructure) {
    return text
  }

  // 1. Convert bullet chars (•, ▪, ‣) into newline bullets
  text = text.replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB]\s*/g, '\n- ')

  // 2. Prepend callout for Note: ...
  text = text.replace(/(?:^|\n|\.\s+)(Note:\s*)([^\n]+?)(?=(?:Minimum qualifications|Preferred qualifications|Responsibilities|Qualifications|About|Overview|$))/gi, (m, p1, content) => {
    return `\n\n> **Note:** ${(content || '').trim()}\n\n`
  })

  // 3. Metadata prefix like "InternshipIn Office Full Stack - InternID: ONE-FULSTA-7QL1"
  text = text.replace(/^Internship\s*In\s*Office\s*Full\s*Stack\s*-\s*InternID:\s*(\S+)\s*/i, (m, id) => {
    return `> **Job Code:** ${id} · **Workplace:** In Office · **Type:** Internship\n\n`
  })

  // 4. Skills extraction: "Required Skills JavaScriptJavaReact..."
  text = text.replace(/Required\s*Skills\s+([A-Za-z0-9\s/\-_.,]+?)(?=(?:Qualifications|Responsibilities|Requirements|About|$))/i, (m, skillStr) => {
    const knownSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'Python',
      'UX/UI Design', 'REST API', 'GraphQL', 'CSS', 'HTML', 'AWS', 'Azure', 'GCP',
      'PostgreSQL', 'postgress', 'Vector DB', 'vectordb', 'RAG', 'rag', 'SQL',
      'Docker', 'Kubernetes', 'Git', 'Next.js', 'Tailwind'
    ]
    let remaining = skillStr
    const found = []
    knownSkills.forEach(k => {
      const reg = new RegExp(k, 'i')
      if (reg.test(remaining)) {
        found.push(k.replace(/postgress/i, 'PostgreSQL').replace(/vectordb/i, 'Vector DB').replace(/^rag$/i, 'RAG'))
        remaining = remaining.replace(reg, ' ')
      }
    })
    if (found.length > 0) {
      return `\n\n## Required Skills\n\n` + found.map(s => `\`${s}\``).join('  ') + `\n\n`
    }
    return `\n\n## Required Skills\n\n${skillStr}\n\n`
  })

  // Specific role subsection triggers
  text = text.replace(/(You will work at the intersection of:?)/gi, '\n\n### $1\n\n')
  text = text.replace(/(This role is for someone who can:?)/gi, '\n\n### $1\n\n')
  text = text.replace(/(Prompt engineering for code generation)/gi, '\n\n### $1\n\n')
  text = text.replace(/(Using AI for:?)/gi, '\n\n### $1\n\n')
  text = text.replace(/([a-z0-9])\s*(Ability to:)/gi, '$1\n\n### $2\n\n')
  text = text.replace(/(?:^|\n|\.\s+)(Ability to:)/gi, '\n\n### $1\n\n')

  // Handle specific list patterns
  text = text.replace(/Human thinking\s*,\s*AI-assisted development[^,]+,\s*Production-grade systems/gi, (m) => {
    return m.split(',').map(s => `- ${s.trim()}`).join('\n')
  })
  text = text.replace(/Use AI to move fast\s*,\s*But also override, debug, and outthink AI when it fails\./gi, () => {
    return `- Use AI to move fast\n- Override, debug, and outthink AI when it fails.`
  })
  text = text.replace(/Code scaffolding\s*,\s*Debugging assistance\s*,\s*Refactoring/gi, () => {
    return `- Code scaffolding\n- Debugging assistance\n- Refactoring`
  })
  text = text.replace(/Validate AI-generated code\s+Optimize beyond AI suggestions and Maintain clean architecture/gi, () => {
    return `- Validate AI-generated code\n- Optimize beyond AI suggestions\n- Maintain clean architecture`
  })

  // 5. Prepend H2 for major headings
  const majorHeadings = [
    { title: 'About the Job', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(About [Tt]he [Jj]ob)\b/g },
    { title: 'About This Role', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(About [Tt]his [Rr]ole)\b/g },
    { title: 'About The Role', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(About [Tt]he [Rr]ole)\b/g },
    { title: 'About Us', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(About [Uu]s)\b/g },
    { title: 'About The Company', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(About [Tt]he [Cc]ompany)\b/g },
    { title: 'Job Overview', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Job Overview|Job Summary)\b/g },
    { title: 'Overview', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Overview)\b(?!\s+(?:of|for|with|to|in))/g },
    { title: 'Responsibilities', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))((?:Key\s+)?Responsibilities)\b/g },
    { title: "What You'll Do", pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(What [Yy]ou(?:\x27ll|\s+will)\s+[Dd]o)\b/g },
    { title: 'Qualifications', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Qualifications)\b(?!\s*:)/g },
    { title: 'Requirements', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Requirements|Key Requirements)\b(?!\s+(?:of|for))/g },
    { title: 'Benefits & What We Offer', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(What [Ww]e [Oo]ffer|Benefits|Perks)\b/g },
    { title: 'Equal Opportunity', pattern: /(?:^|\n|\.\s{1,2})((?:Google|Microsoft|[A-Z][a-z]+)\s+is\s+(?:an\s+)?(?:equal\s+opportunity|proud\s+to\s+be\s+an\s+equal)\b)/g }
  ]

  // Subheadings (H3)
  const subHeadings = [
    { title: 'Minimum Qualifications', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Minimum [Qq]ualifications:?)/gi },
    { title: 'Preferred Qualifications', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Preferred [Qq]ualifications:?)/gi },
    { title: 'Basic Qualifications', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Basic [Qq]ualifications:?)/gi },
    { title: 'Desired Qualifications', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Desired [Qq]ualifications:?)/gi },
    { title: 'Who You Are', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(Who [Yy]ou [Aa]re:?)/gi },
    { title: 'What You Will Bring', pattern: /(?:^|\n|\.\s{1,2}|(?:\s{2,}))(What [Yy]ou(?:\x27ll|\s+will)\s+[Bb]ring:?)/gi }
  ]

  const H2_TAG = '@@@H2@@@'
  const H3_TAG = '@@@H3@@@'

  majorHeadings.forEach(({ title, pattern }) => {
    text = text.replace(pattern, (match, captured) => {
      if (title === 'Equal Opportunity') {
        return `\n\n${H2_TAG}${title}\n\n${captured}`
      }
      return `\n\n${H2_TAG}${title}\n\n`
    })
  })

  subHeadings.forEach(({ title, pattern }) => {
    text = text.replace(pattern, () => `\n\n${H3_TAG}${title}\n\n`)
  })

  // Separate degrees in Qualifications
  text = text.replace(/(\([^)]+\))\s+(?=(?:Bachelor|Master|Doctor|Diploma|Associate))/gi, '$1\n- ')

  const lines = text.split('\n')
  const output = []
  let currentHeader = ''

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) continue

    if (line.startsWith(H2_TAG)) {
      currentHeader = line.replace(H2_TAG, '').trim()
      output.push(`\n## ${currentHeader}\n`)
      continue
    }

    if (line.startsWith(H3_TAG)) {
      currentHeader = line.replace(H3_TAG, '').trim()
      output.push(`\n### ${currentHeader}\n`)
      continue
    }

    if (line.startsWith('### ')) {
      currentHeader = line.replace('### ', '').trim()
      output.push(`\n${line}\n`)
      continue
    }

    const isListContext = /qualification|responsibilit|requirement|what you/i.test(currentHeader)

    if (isListContext) {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        output.push(line)
        continue
      }

      // Action verbs or qualification starters
      const bulletRegex = /^(?:Bachelor|Master|Doctor|BE|BTech|MCA|BCA|Diploma|Experience|Ability|Proficien|Knowledge|Proven|Expert|\d+\+?\s*years?|Deliver|Act|Provide|Drive|Lead|Build|Resolve|Maintain|Represent|Collaborate|Design|Develop|Work|Support|Ensure|Guide|Manage|Create|Implement|Test|Deploy)\b/i

      // Split into sentences
      const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      sentences.forEach(s => {
        const sTrim = s.trim()
        if (!sTrim) return
        if (bulletRegex.test(sTrim)) {
          output.push(`- ${sTrim}`)
        } else {
          output.push(sTrim)
        }
      })
      continue
    }

    // Default: paragraphs
    if (line.startsWith('>') || line.startsWith('#') || line.startsWith('-') || line.startsWith('`')) {
      output.push(line)
    } else {
      const sentences = line.split(/(?<=[.!?])\s{2,}(?=[A-Z])/)
      sentences.forEach(s => {
        const sTrim = s.trim()
        if (sTrim) output.push(sTrim)
      })
    }
  }

  let finalMarkdown = output.join('\n\n')
  while (/(\n-[^\n]+)\n{2,}(?=-\s+)/.test(finalMarkdown)) {
    finalMarkdown = finalMarkdown.replace(/(\n-[^\n]+)\n{2,}(?=-\s+)/g, '$1\n')
  }
  finalMarkdown = finalMarkdown.replace(/\n{3,}/g, '\n\n')

  return finalMarkdown.trim()
}

const JobDescription = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { singleJob } = useSelector(state => state.job)
  const { user } = useSelector(state => state.auth)

  const params = useParams()
  const jobId = params.id

  const checkHasApplied = (applicationsList, userId) => {
    if (!Array.isArray(applicationsList) || !userId) return false
    return applicationsList.some((app) => {
      const applicantId = app?.applicant?._id || app?.applicant
      return applicantId?.toString() === userId?.toString()
    })
  }

  const isInitiallyApplied = checkHasApplied(singleJob?.applications, user?._id)

  const [isApplied, setIsApplied] = useState(isInitiallyApplied)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBookmarked = user?.bookmarks?.some(
    (id) => (typeof id === 'string' ? id : id?._id) === jobId
  ) || false

  const bookmarkHandler = async () => {
    if (!user) {
      toast.error("Please login to save jobs")
      navigate("/login")
      return
    }
    try {
      const response = await axios.post(`${USER_API_END_POINT}/bookmark/${jobId}`, {}, {
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

  const applyJobHandler = async () => {
    if (!user) {
      toast.error("Please log in to apply for this job")
      navigate("/login")
      return
    }

    if (user.role === "recruiter") {
      toast.error("Recruiters cannot apply for jobs. Please switch to a job seeker account.")
      return
    }

    if (!user.profile?.resume) {
      toast.error("Resume Required to Apply", {
        description: "Employers require a resume on file before reviewing your application. Please upload your resume in your profile.",
        action: {
          label: "Go to Profile",
          onClick: () => navigate("/profile"),
        },
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await axios.post(
        `${APPLICANT_API_END_POINT}/apply/${jobId}`,
        {},
        { withCredentials: true }
      )
      if (response.data.success) {
        setIsApplied(true)
        const currentCount = singleJob?.applicantCount ?? singleJob?.applications?.length ?? 0
        const updatedSingleJob = {
          ...singleJob,
          applicantCount: currentCount + 1,
          applications: [
            ...(singleJob?.applications || []),
            { applicant: { _id: user?._id, fullname: user?.fullname, email: user?.email } },
          ],
        }
        dispatch(setSingleJob(updatedSingleJob))
        toast.success(response.data.message || "Application submitted successfully!")
      }
    } catch (error) {
      console.error("Apply error:", error)
      const msg = error.response?.data?.message || "Failed to submit application"
      if (error.response?.data?.missingResume) {
        toast.error("Resume Required", {
          description: "Please upload your resume in your profile before applying.",
          action: {
            label: "Go to Profile",
            onClick: () => navigate("/profile"),
          },
        })
      } else {
        toast.error(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const fetchSingleJobDescription = async () => {
      try {
        const response = await axios.get(
          `${JOB_API_END_POINT}/get/${jobId}`,
          { withCredentials: true }
        )
        if (response.data.success) {
          dispatch(setSingleJob(response.data.job))
          setIsApplied(checkHasApplied(response.data.job?.applications, user?._id))
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchSingleJobDescription()
  }, [jobId, dispatch, user?._id])

  return (
    <div>
      <Navbar />
      <div className="px-[6%] my-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bold text-2xl text-gray-900">{singleJob?.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{singleJob?.company?.companyName} · {singleJob?.location}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge className="text-blue-700 font-bold" variant="ghost">
                {singleJob?.position} positions
              </Badge>
              <Badge className="text-[#F83002] font-bold" variant="ghost">
                {singleJob?.jobType}
              </Badge>
              <Badge className="text-[#7209b7] font-bold" variant="ghost">
                {singleJob?.salary} LPA
              </Badge>
              <Badge className="text-green-700 font-bold" variant="ghost">
                {singleJob?.experienceLevel} yrs exp
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={bookmarkHandler}
              className={`rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                isBookmarked 
                  ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100' 
                  : 'hover:border-purple-300 hover:text-purple-700'
              }`}
              title={isBookmarked ? "Remove from bookmarks" : "Save for later"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-purple-700 text-purple-700' : ''}`} />
              <span>{isBookmarked ? 'Saved' : 'Save for Later'}</span>
            </Button>
            <Button
              onClick={isApplied || isSubmitting ? null : applyJobHandler}
              disabled={isApplied || isSubmitting}
              className={`rounded-lg flex items-center justify-center ${
                isApplied
                  ? 'bg-gray-600 cursor-not-allowed text-white'
                  : isSubmitting
                  ? 'bg-[#7209b7]/70 text-white cursor-wait'
                  : 'bg-[#7209b7] hover:bg-[#5f08ad] cursor-pointer text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : isApplied ? (
                'Applied'
              ) : (
                'Apply Now'
              )}
            </Button>
          </div>
        </div>

        {/* Meta info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm">
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Role</p>
            <p className="font-semibold text-gray-800">{singleJob?.title}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Location</p>
            <p className="font-semibold text-gray-800">{singleJob?.location}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Salary</p>
            <p className="font-semibold text-gray-800">{singleJob?.salary} LPA</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Applicants</p>
            <p className="font-semibold text-gray-800">{singleJob?.applications?.length}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Experience</p>
            <p className="font-semibold text-gray-800">{singleJob?.experienceLevel} yrs</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Job Type</p>
            <p className="font-semibold text-gray-800">{singleJob?.jobType}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Posted</p>
            <p className="font-semibold text-gray-800">{singleJob?.createdAt?.split('T')[0]}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase text-xs tracking-wide mb-0.5">Positions</p>
            <p className="font-semibold text-gray-800">{singleJob?.position}</p>
          </div>
        </div>

        {/* Job Description — rich formatted */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
            Job Description
          </h2>
          <div className="text-gray-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {normalizeDescription(singleJob?.description)}
            </ReactMarkdown>
          </div>
        </div>

      </div>
    </div>
  )
}

export default JobDescription
