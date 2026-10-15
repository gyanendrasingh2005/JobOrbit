import React, { useState, useRef } from 'react'
import Navbar from './shared/Navbar';
import { Avatar, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Contact, Mail, Pen, Camera, Loader2, FileText, Briefcase, Star, Bookmark } from 'lucide-react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import AppliedJobTable from './AppliedJobTable';
import SavedJobTable from './SavedJobTable';
import UpdateProfileDialog from './UpdateProfileDialog';
import { useSelector, useDispatch } from 'react-redux';
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs';
import useGetSavedJobs from '@/hooks/useGetSavedJobs';
import Footer from './shared/Footer';
import { motion } from "framer-motion";
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';

function Profile() {
    useGetAppliedJobs();
    useGetSavedJobs();
    const dispatch = useDispatch();

    const [open, setOpen] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('applied');
    const { user } = useSelector(store => store.auth);
    const { allAppliedJobs, savedJobs } = useSelector(store => store.job);
    const photoInputRef = useRef(null);

    const handleAvatarClick = () => {
        photoInputRef.current?.click();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be smaller than 5MB');
            return;
        }

        setPhotoLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${USER_API_END_POINT}/profile/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });

            if (response.data.success) {
                dispatch(setUser(response.data.user));
                toast.success('Profile photo updated! 🎉');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update photo');
        } finally {
            setPhotoLoading(false);
            // Reset input so same file can be re-selected
            e.target.value = '';
        }
    };

    const initials = user?.fullname
        ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <>
            <Navbar />

            {/* Hidden file input for photo upload */}
            <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
            />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16"
                >
                    {/* Profile Header Card */}
                    <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        {/* Cover banner */}
                        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                            <div className="absolute inset-0 bg-black/10" />
                            {/* Decorative circles */}
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                            <div className="absolute top-4 right-16 w-16 h-16 bg-white/10 rounded-full" />
                        </div>

                        <div className="px-6 sm:px-8 pb-6">
                            {/* Avatar row */}
                            <div className="flex items-end justify-between -mt-14 mb-4">
                                {/* Clickable avatar */}
                                <div className="relative group">
                                    <div
                                        className="relative w-24 h-24 rounded-full ring-4 ring-white shadow-lg cursor-pointer overflow-hidden"
                                        onClick={handleAvatarClick}
                                        title="Click to update profile photo"
                                    >
                                        {photoLoading ? (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            </div>
                                        ) : user?.profile?.profilePhoto ? (
                                            <img
                                                src={user.profile.profilePhoto}
                                                alt="Profile"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                                {initials}
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <Camera className="w-6 h-6 text-white mb-1" />
                                            <span className="text-white text-[10px] font-medium text-center leading-tight px-1">
                                                Change Photo
                                            </span>
                                        </div>
                                    </div>

                                    {/* Camera badge */}
                                    <button
                                        onClick={handleAvatarClick}
                                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-md transition-colors duration-200 border-2 border-white"
                                        title="Update profile photo"
                                    >
                                        <Camera className="w-3.5 h-3.5 text-white" />
                                    </button>
                                </div>

                                {/* Edit profile button */}
                                <Button
                                    onClick={() => setOpen(true)}
                                    variant="outline"
                                    className="gap-2 text-sm font-medium border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 rounded-xl"
                                >
                                    <Pen className="w-4 h-4" />
                                    Edit Profile
                                </Button>
                            </div>

                            {/* Name & bio */}
                            <div className="mb-4">
                                <h1 className="text-2xl font-bold text-gray-900">{user?.fullname}</h1>
                                <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                                    {user?.profile?.bio || 'No bio added yet. Click Edit Profile to add one.'}
                                </p>
                            </div>

                            {/* Contact info */}
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                                    <Mail className="w-4 h-4 text-indigo-500" />
                                    <span>{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                                    <Contact className="w-4 h-4 text-indigo-500" />
                                    <span>{user?.phoneNumber}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills & Resume Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Skills Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Star className="w-4 h-4 text-amber-600" />
                                </div>
                                <h2 className="font-bold text-gray-900">Skills</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {user?.profile?.skills?.length > 0 ? (
                                    user.profile.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100"
                                        >
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No skills added yet</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Resume Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <h2 className="font-bold text-gray-900">Resume</h2>
                            </div>
                            {user?.profile?.resume ? (
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={user.profile.resume}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors duration-200 border border-blue-100 hover:border-blue-200"
                                >
                                    <FileText className="w-4 h-4" />
                                    {user.profile.resumeOriginalName || 'View Resume'}
                                </a>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No resume uploaded yet</p>
                            )}
                        </motion.div>
                    </div>

                    {/* Jobs Management Card (Applied & Saved) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                    >
                        {/* Tabs Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('applied')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                        activeTab === 'applied'
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    <span>Applied Jobs</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        activeTab === 'applied' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {allAppliedJobs?.length || 0}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('saved')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                        activeTab === 'saved'
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Bookmark className="w-4 h-4" />
                                    <span>Saved Jobs</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                        activeTab === 'saved' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {savedJobs?.length || 0}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {activeTab === 'applied' ? (
                            <AppliedJobTable />
                        ) : (
                            <SavedJobTable />
                        )}
                    </motion.div>
                </motion.div>
            </div>

            {/* Update Profile Dialog */}
            <UpdateProfileDialog open={open} setOpen={setOpen} />

            <Footer />
        </>
    );
}

export default Profile;
