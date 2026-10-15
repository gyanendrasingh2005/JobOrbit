import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import useGetAllCompanies from '@/hooks/useGetAllCompanies'

const EditJob = () => {
    useGetAllCompanies()
    const { companies } = useSelector(store => store.company)
    const navigate = useNavigate()
    const params = useParams()
    const jobId = params.id

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [input, setInput] = useState({
        title: '',
        description: '',
        requirements: '',
        salary: '',
        location: '',
        experience: '',
        jobType: '',
        position: 0,
        companyId: '',
    })

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setFetching(true)
                const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
                    withCredentials: true,
                })
                if (res.data.success) {
                    const job = res.data.job
                    setInput({
                        title: job?.title || '',
                        description: job?.description || '',
                        requirements: Array.isArray(job?.requirements)
                            ? job.requirements.join(', ')
                            : (job?.requirements || ''),
                        salary: job?.salary ?? '',
                        location: job?.location || '',
                        experience: job?.experienceLevel ?? '',
                        jobType: job?.jobType || '',
                        position: job?.position ?? 0,
                        companyId: typeof job?.company === 'object' ? job?.company?._id : job?.company || '',
                    })
                }
            } catch (error) {
                console.error(error)
                toast.error(error?.response?.data?.message || 'Failed to load job details')
            } finally {
                setFetching(false)
            }
        }
        if (jobId) {
            fetchJob()
        }
    }, [jobId])

    const selectChangeHandler = (value) => {
        const selectedCompany = companies.find((c) => c.companyName.toLowerCase() === value.toLowerCase())
        if (selectedCompany) {
            setInput({ ...input, companyId: selectedCompany._id })
        }
    }

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value })
    }

    const updateJobHandler = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const res = await axios.put(`${JOB_API_END_POINT}/update/${jobId}`, input, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            })
            if (res.data.success) {
                toast.success(res.data.message || 'Job updated successfully')
                navigate('/admin/jobs')
            }
        } catch (error) {
            console.error(error)
            toast.error(error?.response?.data?.message || 'Failed to update job')
        } finally {
            setLoading(false)
        }
    }

    const currentCompanyName = companies.find(c => c._id === input.companyId)?.companyName || ''

    if (fetching) {
        return (
            <div>
                <Navbar />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#7209b7]" />
                    <span className="ml-2 text-gray-600 font-medium">Loading job details...</span>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Navbar />
            <div className="max-w-2xl mx-auto my-8 px-4">
                <Button
                    onClick={() => navigate('/admin/jobs')}
                    variant="outline"
                    className="flex items-center gap-2 text-gray-500 font-semibold mb-5 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </Button>

                <form onSubmit={updateJobHandler} className="p-8 border border-gray-200 shadow-lg rounded-xl bg-white">
                    <h1 className="font-bold text-2xl text-gray-900 mb-1">Update Job</h1>
                    <p className="text-sm text-gray-500 mb-6">Modify the details of your posted job listing.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium text-gray-700">Title</Label>
                            <Input
                                type="text"
                                name="title"
                                value={input.title}
                                placeholder="e.g. Senior Frontend Engineer"
                                onChange={changeEventHandler}
                                required
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>

                        <div>
                            <Label className="font-medium text-gray-700">Location</Label>
                            <Input
                                type="text"
                                name="location"
                                value={input.location}
                                placeholder="e.g. Bengaluru, India / Remote"
                                onChange={changeEventHandler}
                                required
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Label className="font-medium text-gray-700">Description</Label>
                            <textarea
                                name="description"
                                rows={6}
                                value={input.description}
                                placeholder="Write detailed job description with responsibilities and requirements..."
                                onChange={changeEventHandler}
                                required
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring my-1 leading-relaxed"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Label className="font-medium text-gray-700">Requirements (separated by comma)</Label>
                            <Input
                                type="text"
                                name="requirements"
                                value={input.requirements}
                                onChange={changeEventHandler}
                                placeholder="React, Node.js, TypeScript, AWS"
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>

                        <div>
                            <Label className="font-medium text-gray-700">Salary (LPA)</Label>
                            <Input
                                type="number"
                                name="salary"
                                value={input.salary}
                                placeholder="e.g. 15"
                                onChange={changeEventHandler}
                                required
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>

                        <div>
                            <Label className="font-medium text-gray-700">Job Type</Label>
                            <Input
                                type="text"
                                name="jobType"
                                placeholder="Full Time, Part Time, Internship"
                                value={input.jobType}
                                onChange={changeEventHandler}
                                required
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>

                        <div>
                            <Label className="font-medium text-gray-700">Experience Level (Years)</Label>
                            <Input
                                type="number"
                                name="experience"
                                placeholder="e.g. 2"
                                value={input.experience}
                                onChange={changeEventHandler}
                                required
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>

                        <div>
                            <Label className="font-medium text-gray-700">Number of Positions</Label>
                            <Input
                                type="number"
                                name="position"
                                placeholder="e.g. 3"
                                value={input.position}
                                onChange={changeEventHandler}
                                required
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Label className="font-medium text-gray-700">Company</Label>
                            {companies.length > 0 ? (
                                <Select
                                    value={currentCompanyName}
                                    onValueChange={selectChangeHandler}
                                >
                                    <SelectTrigger className="my-1">
                                        <SelectValue placeholder={currentCompanyName || "Select a Company"} />
                                        <SelectContent>
                                            <SelectGroup>
                                                {companies.map((company) => (
                                                    <SelectItem
                                                        key={company._id}
                                                        value={company.companyName}
                                                    >
                                                        {company.companyName}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </SelectTrigger>
                                </Select>
                            ) : (
                                <p className="text-xs text-amber-600 mt-1">No companies registered.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/admin/jobs')}
                            className="w-1/2 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-1/2 bg-[#7209b7] hover:bg-[#5f08ad] text-white cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Job'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditJob
