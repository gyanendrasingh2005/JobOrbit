import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Edit2, Eye, MoreHorizontal, Trash2, Loader2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constant'
import { setAllAdminJobs } from '@/redux/jobSlice'
import { toast } from 'sonner'

const AdminJobsTable = () => {
    const { allAdminJobs, searchJobByText } = useSelector(store => store.job);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [filterJobs, setFilterJobs] = useState(allAdminJobs);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const filteredJobs = allAdminJobs.length >= 0 && allAdminJobs.filter((job) => {
            if (!searchJobByText) {
                return true
            };
            return job?.company?.companyName?.toLowerCase().includes(searchJobByText.toLowerCase()) ||
                job?.title?.toLowerCase().includes(searchJobByText.toLowerCase())
        })

        setFilterJobs(filteredJobs);
    }, [allAdminJobs, searchJobByText])

    const handleDeleteJob = async () => {
        if (!jobToDelete?._id) return;
        try {
            setDeleting(true);
            const res = await axios.delete(`${JOB_API_END_POINT}/delete/${jobToDelete._id}`, {
                withCredentials: true,
            });
            if (res.data.success) {
                toast.success(res.data.message || 'Job deleted successfully');
                dispatch(setAllAdminJobs(allAdminJobs.filter((j) => j._id !== jobToDelete._id)));
                setJobToDelete(null);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to delete job');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <Table>
                <TableCaption>A list of your recent posted jobs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Applicants</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        filterJobs && filterJobs?.map((job) => (
                            <tr key={job._id}>
                                <TableCell>{job?.company?.companyName}</TableCell>
                                <TableCell>{job?.title}</TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                                        title="View candidate applications"
                                    >
                                        <Eye className="w-3 h-3" />
                                        <span>{job?.applicantCount ?? job?.applications?.length ?? 0}</span>
                                    </button>
                                </TableCell>
                                <TableCell>{job?.createdAt.split("T")[0]}</TableCell>
                                <TableCell className="text-right">
                                    <Popover>
                                        <PopoverTrigger className="cursor-pointer p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-36 flex flex-col gap-1 p-2">
                                            <div
                                                onClick={() => navigate(`/admin/jobs/${job._id}`)}
                                                className="flex items-center w-full cursor-pointer gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                                <span>Edit</span>
                                            </div>
                                            <div
                                                onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                                                className="flex items-center w-full cursor-pointer gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4 text-purple-600" />
                                                <span>Applicants</span>
                                            </div>
                                            <div
                                                onClick={() => setJobToDelete(job)}
                                                className="flex items-center w-full cursor-pointer gap-2 px-2 py-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                <span>Delete</span>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </tr>
                        ))
                    }
                </TableBody>
            </Table>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">Delete Job Posting</DialogTitle>
                        <DialogDescription className="text-gray-600 text-sm mt-2">
                            Are you sure you want to delete <strong className="text-gray-900">{jobToDelete?.title}</strong>? This will permanently delete the job and remove all applicant records associated with it. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setJobToDelete(null)}
                            disabled={deleting}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteJob}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Job'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AdminJobsTable;

