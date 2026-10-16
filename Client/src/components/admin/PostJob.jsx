import React, { useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'




const PostJob = () => {

    const { companies } = useSelector(store => store.company)
    const navigate = useNavigate();


    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState({
        title: "",
        description: "",
        requirements: "",
        salary: "",
        location: "",
        experience: "",
        jobType: "",
        position: 0,
        companyId: "",
        totalRounds: 2,
        interviewRounds: [
            { roundNumber: 1, name: "Round 1 (Technical Screening)" },
            { roundNumber: 2, name: "Round 2 (Final Interview)" },
        ],
    });

    const handleTotalRoundsChange = (num) => {
        const count = Math.max(1, Math.min(7, parseInt(num) || 1));
        const defaultNames = [
            "Round 1 (Screening)",
            "Round 2 (Technical)",
            "Round 3 (System Design)",
            "Round 4 (Managerial)",
            "Round 5 (Leadership)",
            "Round 6 (Culture & Fit)",
            "Round 7 (Final Review)"
        ];
        const newRounds = Array.from({ length: count }, (_, idx) => {
            const existing = input.interviewRounds[idx];
            return {
                roundNumber: idx + 1,
                name: existing?.name || defaultNames[idx] || `Round ${idx + 1}`,
            };
        });
        setInput({
            ...input,
            totalRounds: count,
            interviewRounds: newRounds,
        });
    };

    const handleRoundNameChange = (index, name) => {
        const updated = [...input.interviewRounds];
        updated[index] = { ...updated[index], name };
        setInput({ ...input, interviewRounds: updated });
    };

    const selectChangeHandler = (value) => {
        const selectedCompany = companies.find((company) => company.companyName.toLowerCase() === value.toLowerCase());
        setInput({ ...input, companyId: selectedCompany._id })
    }

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value })
    }


    const postNewJob = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post(`${JOB_API_END_POINT}/post`, input, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            })

            if (response.data.success) {
                toast.success(response.data.message);
                navigate("/admin/jobs");
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response.data.message)
        } finally {
            setLoading(false);
        }
    }




    return (
        <div>
            <Navbar />
            <div className='flex items-center justify-center w-screen my-5'>
                <form onSubmit={postNewJob} className='p-8 border border-gray-200 shadow-lg rounded-md'>
                    <div className='grid grid-cols-2 gap-2 '>
                        <div>
                            <Label>Title</Label>
                            <Input
                                type="text"
                                name="title"
                                value={input.title}
                                placeholder="Write job title"
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input
                                type="text"
                                name="description"
                                placeholder="Write job Description"
                                value={input.description}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label>Requirements</Label>
                            <Input
                                type="text"
                                name="requirements"
                                value={input.requirements}
                                onChange={changeEventHandler}
                                placeholder="Seprated with Comma"
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label>Salary</Label>
                            <Input
                                type="number"
                                name="salary"
                                value={input.salary}
                                placeholder="Write in LPA"
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input
                                type="text"
                                name="location"
                                value={input.location}
                                placeholder="Job Loaction"
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label>Job Type</Label>
                            <Input
                                type="text"
                                name="jobType"
                                placeholder="Full Time or Part Time"
                                value={input.jobType}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label>Experience Level</Label>
                            <Input
                                type="number"
                                name="experience"
                                placeholder="Experience required"
                                value={input.experience}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>
                        <div>
                            <Label>No of Position</Label>
                            <Input
                                type="number"
                                name="position"
                                placeholder="Write no. of opening"
                                value={input.position}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                            />
                        </div>


                        {
                            companies.length > 0
                            &&

                            <Select onValueChange={selectChangeHandler}>
                                <SelectTrigger>
                                    <SelectValue placeholder={"Select a Company"} />
                                    <SelectContent>
                                        <SelectGroup>
                                            {
                                                companies.map((company) => {
                                                    return (
                                                        <SelectItem
                                                            key={company._id}
                                                            value={company.companyName}
                                                        >
                                                            {company.companyName}
                                                        </SelectItem>
                                                    )
                                                })
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </SelectTrigger>
                            </Select>
                        }



                    </div>

                    {/* Recruiter-Configured Interview Rounds */}
                    <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div>
                                <Label className="text-sm font-bold text-gray-800">
                                    Hiring & Interview Rounds
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Decide how many interview rounds this opening requires (e.g. 1 to 7 rounds).
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600">Total Rounds:</span>
                                <select
                                    value={input.totalRounds}
                                    onChange={(e) => handleTotalRoundsChange(e.target.value)}
                                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value={1}>1 Round (Single Stage)</option>
                                    <option value={2}>2 Rounds (Standard)</option>
                                    <option value={3}>3 Rounds (Comprehensive)</option>
                                    <option value={4}>4 Rounds (In-Depth)</option>
                                    <option value={5}>5 Rounds (Multi-Stage)</option>
                                    <option value={6}>6 Rounds (Executive)</option>
                                    <option value={7}>7 Rounds (Full Pipeline)</option>
                                </select>
                            </div>
                        </div>

                        {/* Configurable Round Names */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {input.interviewRounds.map((round, idx) => (
                                <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
                                    <Label className="text-xs font-semibold text-purple-700 block mb-1">
                                        Round {idx + 1} Name
                                    </Label>
                                    <Input
                                        type="text"
                                        value={round.name}
                                        onChange={(e) => handleRoundNameChange(idx, e.target.value)}
                                        placeholder={`e.g. Round ${idx + 1}`}
                                        className="text-xs h-8 focus-visible:ring-1 focus-visible:ring-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {
                        loading ? <Button className="mt-4 w-full"><Loader2 className='mr-2 h-4 w-4 animate-spin ' /> Please wait</Button>
                            :
                            <Button type="submit" className="w-full mt-4">Post New Job</Button>
                    }


                    {
                        companies.length === 0 &&
                        <p className='text-sm text-red-600 font-bold text-center my-3 hover:text-fuchsia-600 hover:cursor-pointer hover:scale-105 transition-all ' onClick={() => navigate("/admin/companies/create")}>
                            *Please a register a company first
                        </p>
                    }

                </form>

            </div>
        </div>
    )
}

export default PostJob

