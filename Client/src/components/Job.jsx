import React from 'react'
import { Button } from './ui/button'
import { Bookmark } from 'lucide-react'
import { Avatar, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { setBookmarks } from '@/redux/authSlice'
import { toast } from 'sonner'

const Job = ({ job }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector(store => store.auth);

    const isBookmarked = user?.bookmarks?.some(
        (id) => (typeof id === 'string' ? id : id?._id) === job?._id
    ) || false;

    const bookmarkHandler = async () => {
        if (!user) {
            toast.error("Please login to save jobs");
            navigate("/login");
            return;
        }
        try {
            const response = await axios.post(`${USER_API_END_POINT}/bookmark/${job?._id}`, {}, {
                withCredentials: true,
            });
            if (response.data.success) {
                dispatch(setBookmarks(response.data.bookmarks));
                if (response.data.isBookmarked) {
                    toast.success("Job saved for later ⭐");
                } else {
                    toast.success("Job removed from bookmarks");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    };

    const daysAgoFunction = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentDate = new Date();
        const differenceInTime = currentDate.getTime() - createdAt.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
        return Math.floor(differenceInDays);
    }

    return (
        <div className='p-5 rounded-md shadow-xl bg-white border border-gray-100 hover:scale-105 transition-all duration-500 h-full flex flex-col'>
            <div className='flex justify-between items-center'>
                <p className='text-sm text-gray-500'>
                    {daysAgoFunction(job?.createdAt) === 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} days ago`}
                </p>
                <Button 
                    variant="outline" 
                    className={`rounded-full cursor-pointer transition-colors ${
                        isBookmarked 
                            ? "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200" 
                            : "hover:text-purple-700"
                    }`} 
                    size="icon"
                    onClick={bookmarkHandler}
                    title={isBookmarked ? "Remove from bookmarks" : "Save for later"}
                >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-purple-700 text-purple-700" : ""}`} />
                </Button>
            </div>

            <div className='flex gap-2 items-center my-2'>
                <Button variant="outline" size="icon" className="p-6" >
                    <Avatar>
                        <AvatarImage
                            src={job?.company?.logo || "https://th.bing.com/th/id/OIP.NU9zscMHAn83CpLA9fDjrgHaHa?rs=1&pid=ImgDetMain"}
                        />
                    </Avatar>
                </Button>
                <div>
                    <h1 className='font-medium text-lg md:text-xl'>{job?.company?.companyName}</h1>
                    <p className='text-sm text-gray-600'>India</p>
                </div>
            </div>

            <div className=''>
                <h1 className='font-bold text-lg my-2 '>{job?.title}</h1>
                <p className='text-sm text-gray-600 line-clamp-2'>{job?.description}</p>
            </div>

            <div className='flex-grow' />

            <div className='flex items-center gap-2 mt-4 flex-wrap'>
                <Badge className="text-blue-700 font-bold" variant="ghost">
                    {job?.position} positions
                </Badge>
                <Badge className="text-[#F83002] font-bold" variant="ghost">
                    {job?.jobType}
                </Badge>
                <Badge className="text-[#7209b7] font-bold" variant="ghost">
                    {job?.salary} LPA
                </Badge>

            </div>

            <div className='flex items-center gap-4 mt-4'>
                <Button className="cursor-pointer" onClick={() => navigate(`/description/${job._id}`)} variant="outline">Details</Button>
                <Button 
                    onClick={bookmarkHandler} 
                    className={`cursor-pointer transition-colors ${
                        isBookmarked 
                            ? "bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200" 
                            : "bg-[#7209b7] text-white hover:bg-[#5f08ad]"
                    }`}
                >
                    {isBookmarked ? "Saved" : "Save For Later"}
                </Button>
            </div>

        </div>
    )
}

export default Job
