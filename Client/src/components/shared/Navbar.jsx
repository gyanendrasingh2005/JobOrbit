import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Avatar, AvatarImage } from '../ui/avatar'
import { Bookmark, BriefcaseBusiness, BuildingIcon, Home, HomeIcon, LogOut, Menu, MenuIcon, SearchCheck, User2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { setUser, setToken } from '@/redux/authSlice'
import { setSearchedQuery } from '@/redux/jobSlice'
import { motion } from 'framer-motion'

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector(store => store.auth);


    const logoutHandler = async () => {
        try {
            const response = await axios.post(`${USER_API_END_POINT}/logout`, {}, {
                withCredentials: true
            })
            if (response.data.success) {
                dispatch(setUser(null));
                dispatch(setToken(null));
                localStorage.removeItem("token");
                navigate('/');
                toast.success(response.data.message);
            }

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to logout");
        }
    }


    const resetQuery = () => {
        dispatch(setSearchedQuery(''))
    }


    return (
        <div className='bg-white overflow-hidden'>
            <div className='flex items-center justify-between mx-auto h-16 max-sm:px-3 sm:px-[5%] lg:px-[10%]'>
                <div onClick={() => navigate("/")} className='cursor-pointer'>
                    <h1 className='max-sm:text-lg text-2xl font-bold tracking-tight'>Job<span className='text-[#F83002]'>Orbit</span></h1>
                </div>
                <div className='flex items-center gap-12 max-sm:gap-5'>
                    <ul className='flex font-medium items-center gap-5 max-sm:hidden'>
                        {
                            user && user.role === "recruiter"
                                ?
                                <>
                                    <li><Link to="/admin/dashboard" className="text-purple-600 font-semibold hover:text-purple-700">Dashboard</Link></li>
                                    <li><Link to="/admin/jobs">Jobs</Link></li>
                                    <li><Link to="/admin/companies">Companies</Link></li>
                                </>
                                : (
                                    <>
                                        <motion.li onClick={resetQuery}><Link to="/">Home</Link></motion.li>
                                        <li onClick={resetQuery}><Link to="/jobs">Jobs</Link></li>
                                        <li onClick={resetQuery}><Link to="/browse">Browse</Link></li>
                                        {user && (
                                            <li>
                                                <Link to="/dashboard" className="text-purple-600 font-semibold hover:text-purple-700">
                                                    Dashboard
                                                </Link>
                                            </li>
                                        )}
                                    </>
                                )
                        }
                    </ul>


                    {
                        !user
                            ?
                            <div className='flex items-center gap-2'>
                                <Link to="/login">
                                    <Button className="cursor-pointer" variant="outline">Login</Button>
                                </Link>
                                <Link to="/signup">
                                    <Button className="bg-[#6A38C2] hover:bg-[#5b30a6] cursor-pointer">Signup</Button>
                                </Link>
                            </div>
                            :
                            <div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Avatar className="cursor-pointer ring-2 ring-purple-100 hover:ring-purple-300 transition-all">
                                            {
                                                user?.profile?.profilePhoto
                                                    ?
                                                    <AvatarImage src={user?.profile?.profilePhoto} alt="profile" />
                                                    :
                                                    <AvatarImage src="https://github.com/shadcn.png" alt="profile" />
                                            }
                                        </Avatar>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div>
                                            <div className='flex gap-4 space-y-2'>
                                                <Avatar className="cursor-pointer">
                                                    {
                                                        user?.profile?.profilePhoto
                                                            ?
                                                            <AvatarImage src={user?.profile?.profilePhoto} alt="profile" />
                                                            :
                                                            <AvatarImage src="https://github.com/shadcn.png" alt="profile" />
                                                    }
                                                </Avatar>
                                                <div>
                                                    <h4 className='font-bold'>{user?.fullname}</h4>
                                                    <p className='text-sm text-muted-foreground'>
                                                        {user?.profile?.bio}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='flex flex-col my-2 text-gray-600'>
                                                {
                                                    user && user?.role === "student" &&
                                                    (
                                                        <>
                                                            <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                                <BriefcaseBusiness className="w-4 h-4 ml-1 text-purple-600" />
                                                                <Button className="cursor-pointer text-purple-700 font-semibold" variant="link"><Link to="/dashboard">Application Dashboard</Link></Button>
                                                            </div>
                                                            <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                                <User2 className="w-4 h-4 ml-1" />
                                                                <Button className="cursor-pointer" variant="link"><Link to="/profile">View Profile</Link></Button>
                                                            </div>
                                                            <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                                <Bookmark className="w-4 h-4 ml-1" />
                                                                <Button className="cursor-pointer" variant="link"><Link to="/profile">Saved Jobs ({user?.bookmarks?.length || 0})</Link></Button>
                                                            </div>
                                                        </>
                                                    )
                                                }
                                                {
                                                    user && user?.role === "recruiter" &&
                                                    (
                                                        <>
                                                            <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                                <BriefcaseBusiness className="w-4 h-4 ml-1 text-purple-600" />
                                                                <Button className="cursor-pointer text-purple-700 font-semibold" variant="link"><Link to="/admin/dashboard">Recruiter Dashboard</Link></Button>
                                                            </div>
                                                            <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                                <BuildingIcon className="w-4 h-4 ml-1" />
                                                                <Button className="cursor-pointer" variant="link"><Link to="/admin/companies">Companies</Link></Button>
                                                            </div>
                                                        </>
                                                    )
                                                }

                                                <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                    <LogOut className="w-4 h-4 ml-1 text-rose-500" />
                                                    <Button onClick={logoutHandler} className="cursor-pointer text-rose-600" variant="link">Logout</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div >
                    }

                    <div className='sm:hidden'>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    {
                                        <MenuIcon className='mt-1' />
                                    }
                                </Avatar>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div>
                                    {
                                        user && user.role === "recruiter"
                                            ?
                                            <div className='flex flex-col gap-3'>
                                                <div onClick={() => navigate("/admin/dashboard")} className='flex items-center gap-3 cursor-pointer text-purple-700 font-semibold'>
                                                    <BriefcaseBusiness className='size-5 text-purple-600' />
                                                    <p className='text-lg font-medium'>Dashboard</p>
                                                </div>
                                                <div onClick={() => navigate("/admin/jobs")} className='flex items-center gap-3 cursor-pointer'>
                                                    <BriefcaseBusiness />
                                                    <p className='text-lg font-medium'>Jobs</p>
                                                </div>
                                                <div onClick={() => navigate("/admin/companies")} className='flex items-center gap-3 cursor-pointer'>
                                                    <BuildingIcon className='size-5' />
                                                    <p className='text-lg font-medium'>Companies</p>
                                                </div>
                                            </div>
                                            : (
                                                <>
                                                    <div className='flex flex-col gap-3'>
                                                        <div
                                                            onClick={() => {
                                                                navigate("/")
                                                                dispatch(setSearchedQuery(""))
                                                            }}
                                                            className='flex items-center gap-3 cursor-pointer'>
                                                            <HomeIcon className='size-5' />
                                                            <p className='text-lg font-medium'>Home</p>
                                                        </div>

                                                        {user && (
                                                            <div onClick={() => navigate("/dashboard")} className='flex items-center gap-3 cursor-pointer text-purple-700 font-semibold'>
                                                                <BriefcaseBusiness className="size-5 text-purple-600" />
                                                                <p className='text-lg font-medium'>Dashboard</p>
                                                            </div>
                                                        )}

                                                        <div onClick={() => navigate("/jobs")} className='flex items-center gap-3 cursor-pointer'>
                                                            <BriefcaseBusiness />
                                                            <p className='text-lg font-medium'>Jobs</p>
                                                        </div>

                                                        <div
                                                            onClick={() => {
                                                                navigate("/browse")
                                                                dispatch(setSearchedQuery(""))
                                                            }}
                                                            className='flex items-center gap-3 cursor-pointer'>
                                                            <SearchCheck />
                                                            <p className='text-lg font-medium'>Browse</p>
                                                        </div>
                                                    </div>

                                                </>
                                            )
                                    }
                                </div>
                            </PopoverContent>
                        </Popover>

                    </div>


                </div >
            </div >
        </div >

    )
}

export default Navbar


