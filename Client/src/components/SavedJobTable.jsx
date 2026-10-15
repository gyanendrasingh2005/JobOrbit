import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookmarkCheck, ExternalLink, Trash2, Building2 } from 'lucide-react';
import { Avatar, AvatarImage } from './ui/avatar';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { setBookmarks } from '@/redux/authSlice';
import { setSavedJobs } from '@/redux/jobSlice';
import { toast } from 'sonner';

const SavedJobTable = () => {
    const { savedJobs } = useSelector(store => store.job);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleRemoveBookmark = async (jobId) => {
        try {
            const response = await axios.post(`${USER_API_END_POINT}/bookmark/${jobId}`, {}, {
                withCredentials: true,
            });
            if (response.data.success) {
                dispatch(setBookmarks(response.data.bookmarks));
                dispatch(setSavedJobs(savedJobs.filter(job => job._id !== jobId)));
                toast.success(response.data.message || "Job removed from saved");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to remove job");
        }
    };

    return (
        <div>
            <Table>
                <TableCaption>
                    A list of your saved jobs for later
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Job Role</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(!savedJobs || savedJobs.length === 0) ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <BookmarkCheck className="w-8 h-8 text-gray-400" />
                                    <p className="font-medium text-gray-700">You haven't saved any jobs yet.</p>
                                    <p className="text-xs text-gray-400">Click "Save For Later" on any job card to save it here.</p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => navigate('/jobs')} 
                                        className="mt-2 text-purple-700 border-purple-200 hover:bg-purple-50"
                                    >
                                        Browse Jobs
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        savedJobs.map((job) => (
                            <TableRow key={job._id} className="hover:bg-slate-50/70 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-9 h-9 border border-gray-100 shadow-xs">
                                            <AvatarImage 
                                                src={job?.company?.logo || "https://th.bing.com/th/id/OIP.NU9zscMHAn83CpLA9fDjrgHaHa?rs=1&pid=ImgDetMain"} 
                                                alt={job?.company?.companyName} 
                                            />
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-gray-900 leading-tight">
                                                {job?.company?.companyName || "Company"}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {job?.jobType || "Full Time"}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium text-gray-800">
                                    {job?.title}
                                </TableCell>
                                <TableCell className="text-gray-600">
                                    {job?.location || "India"}
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold" variant="outline">
                                        {job?.salary} LPA
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/description/${job?._id}`)}
                                            className="cursor-pointer text-xs h-8 px-3 gap-1 hover:border-purple-300 hover:text-purple-700"
                                        >
                                            Details
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleRemoveBookmark(job?._id)}
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                            title="Remove from saved"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default SavedJobTable;
