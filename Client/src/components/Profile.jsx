import React, { useState, useRef } from 'react'
import Navbar from './shared/Navbar';
import { Avatar, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Contact, Mail, Pen, Camera, Loader2, FileText, Briefcase, Star, Bookmark, UploadCloud, Download, Trash2, RefreshCw, ExternalLink, AlertTriangle, Plus, X, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import AppliedJobTable from './AppliedJobTable';
import SavedJobTable from './SavedJobTable';
import UpdateProfileDialog from './UpdateProfileDialog';
import { useSelector, useDispatch } from 'react-redux';
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs';
import useGetSavedJobs from '@/hooks/useGetSavedJobs';
import Footer from './shared/Footer';
import { motion } from "framer-motion";
import axios from 'axios';
import { USER_API_END_POINT, resolveResumeUrl } from '@/utils/constant';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';

function Profile() {
    useGetAppliedJobs();
    useGetSavedJobs();
    const dispatch = useDispatch();

    const [open, setOpen] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('applied');
    const { user } = useSelector(store => store.auth);
    const { allAppliedJobs, savedJobs } = useSelector(store => store.job);
    const photoInputRef = useRef(null);
    const resumeInputRef = useRef(null);

    // Skill Dashboard State
    const [newSkill, setNewSkill] = useState('');
    const [skillLoading, setSkillLoading] = useState(false);
    const [deletingSkill, setDeletingSkill] = useState(null);

    const handleAddSkill = async (skillToAdd) => {
        const target = (skillToAdd || newSkill || '').trim();
        if (!target) return;

        setSkillLoading(true);
        try {
            const res = await axios.post(`${USER_API_END_POINT}/profile/skills/add`, { skill: target }, { withCredentials: true });
            if (res.data.success) {
                dispatch(setUser(res.data.user));
                toast.success(`Skill "${target}" added!`);
                setNewSkill('');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add skill');
        } finally {
            setSkillLoading(false);
        }
    };

    const handleRemoveSkill = async (skillToRemove) => {
        if (!skillToRemove) return;
        setDeletingSkill(skillToRemove);
        try {
            const res = await axios.post(`${USER_API_END_POINT}/profile/skills/remove`, { skill: skillToRemove }, { withCredentials: true });
            if (res.data.success) {
                dispatch(setUser(res.data.user));
                toast.success(`Skill "${skillToRemove}" removed`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove skill');
        } finally {
            setDeletingSkill(null);
        }
    };

    const handleAvatarClick = () => {
        photoInputRef.current?.click();
    };

    const handleResumeClick = () => {
        resumeInputRef.current?.click();
    };

    const handleResumeChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error(`File size exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 5 MB.`);
            e.target.value = '';
            return;
        }

        // Validate type (PDF, DOC, DOCX)
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedExtensions.includes(ext) && !allowedMimes.includes(file.type)) {
            toast.error('Unsupported file format. Please upload a PDF (.pdf) or Word document (.doc, .docx).');
            e.target.value = '';
            return;
        }

        setResumeLoading(true);
        const toastId = toast.loading('Uploading resume...');
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${USER_API_END_POINT}/profile/resume`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });

            if (response.data.success) {
                dispatch(setUser(response.data.user));
                toast.success(response.data.message || 'Resume uploaded successfully! ✅', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to upload resume. Please try again.', { id: toastId });
        } finally {
            setResumeLoading(false);
            e.target.value = '';
        }
    };

    const handleRemoveResume = async () => {
        setRemoveLoading(true);
        const toastId = toast.loading('Removing resume...');
        try {
            const response = await axios.delete(`${USER_API_END_POINT}/profile/resume`, {
                withCredentials: true,
            });
            if (response.data.success) {
                dispatch(setUser(response.data.user));
                toast.success('Resume removed successfully', { id: toastId });
                setRemoveDialogOpen(false);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to remove resume', { id: toastId });
        } finally {
            setRemoveLoading(false);
        }
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

            {/* Hidden file input for resume upload/replace */}
            <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleResumeChange}
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
                        {/* Skill Dashboard Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between"
                        >
                            <div>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                            <Star className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-900 text-base leading-tight">Skill Dashboard</h2>
                                            <p className="text-xs text-gray-400">Technical competencies & expertise</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                        (user?.profile?.skills?.length || 0) >= 6
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                            : (user?.profile?.skills?.length || 0) >= 3
                                            ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                                            : 'text-amber-700 bg-amber-50 border-amber-200'
                                    }`}>
                                        {user?.profile?.skills?.length || 0} {(user?.profile?.skills?.length || 0) === 1 ? 'Skill' : 'Skills'}
                                    </Badge>
                                </div>

                                {/* Readiness Progress Bar */}
                                <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-600 flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Profile Strength
                                        </span>
                                        <span className="font-bold text-gray-800">
                                            {Math.min(100, Math.round(((user?.profile?.skills?.length || 0) / 8) * 100))}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-amber-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.round(((user?.profile?.skills?.length || 0) / 8) * 100))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Interactive Skills Badges */}
                                <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
                                    {user?.profile?.skills && user.profile.skills.length > 0 ? (
                                        user.profile.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200/80 shadow-2xs hover:bg-indigo-100/70 transition-colors"
                                            >
                                                <span>{skill}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    disabled={deletingSkill === skill}
                                                    className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center text-indigo-500 hover:text-indigo-800 transition-colors cursor-pointer"
                                                    title={`Remove ${skill}`}
                                                >
                                                    {deletingSkill === skill ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <X className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic py-1">No skills added yet. Add your technical skills below to match recruiter requirements.</p>
                                    )}
                                </div>
                            </div>

                            {/* Inline Add Skill Input & Suggestions */}
                            <div className="pt-3 border-t border-gray-100 mt-2">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleAddSkill();
                                    }}
                                    className="flex items-center gap-2 mb-2"
                                >
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="Add skill (e.g. React, Docker)..."
                                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                        disabled={skillLoading}
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={skillLoading || !newSkill.trim()}
                                        className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 px-3 h-8 shadow-2xs"
                                    >
                                        {skillLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Add
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* Quick Add Suggested In-Demand Skills */}
                                {(() => {
                                    const userSkills = user?.profile?.skills || [];
                                    const popular = ['React', 'Node.js', 'TypeScript', 'Python', 'MongoDB', 'Docker', 'SQL', 'Git', 'AWS'];
                                    const available = popular.filter(
                                        p => !userSkills.some(us => us.toLowerCase() === p.toLowerCase())
                                    ).slice(0, 4);

                                    if (available.length === 0) return null;

                                    return (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            <span className="text-[11px] text-gray-400 font-medium mr-1">Suggested:</span>
                                            {available.map((sug) => (
                                                <button
                                                    key={sug}
                                                    type="button"
                                                    onClick={() => handleAddSkill(sug)}
                                                    disabled={skillLoading}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-[11px] font-medium transition-all cursor-pointer border border-transparent hover:border-indigo-200"
                                                >
                                                    <Plus className="w-2.5 h-2.5 text-gray-400" />
                                                    <span>{sug}</span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>

                        {/* Resume Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h2 className="font-bold text-gray-900">Resume</h2>
                                    </div>
                                    {user?.profile?.resume && (
                                        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[11px] font-semibold">
                                            {user?.profile?.resumeContentType?.includes('word') || user?.profile?.resumeOriginalName?.endsWith('.doc') || user?.profile?.resumeOriginalName?.endsWith('.docx') ? 'DOC / DOCX' : 'PDF Document'}
                                        </Badge>
                                    )}
                                </div>

                                {user?.profile?.resume ? (
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-semibold text-gray-900 truncate" title={user.profile.resumeOriginalName}>
                                                        {user.profile.resumeOriginalName || 'Resume.pdf'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.profile.resumeUploadedAt
                                                            ? `Uploaded on ${new Date(user.profile.resumeUploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                                            : 'Saved on profile'}
                                                        {user.profile.resumeSize ? ` • ${(user.profile.resumeSize / (1024 * 1024)).toFixed(2)} MB` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/60">
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={resolveResumeUrl(user.profile.resume)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>View</span>
                                            </a>

                                            <a
                                                href={resolveResumeUrl(`${USER_API_END_POINT}/resume/download/${user._id}`)}
                                                download={user.profile.resumeOriginalName || 'Resume.pdf'}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Download</span>
                                            </a>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={resumeLoading}
                                                onClick={handleResumeClick}
                                                className="h-8 text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50 rounded-xl gap-1.5"
                                            >
                                                {resumeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                <span>Replace</span>
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setRemoveDialogOpen(true)}
                                                className="h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl gap-1.5 ml-auto"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Remove</span>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center bg-gray-50/50">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                                            <UploadCloud className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800">No resume uploaded yet</p>
                                        <p className="text-xs text-gray-500 max-w-xs mt-1 mb-4">
                                            Upload your resume in PDF or Word format (max 5 MB) so recruiters can review your profile.
                                        </p>
                                        <Button
                                            type="button"
                                            onClick={handleResumeClick}
                                            disabled={resumeLoading}
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold gap-2 shadow-xs"
                                        >
                                            {resumeLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud className="w-4 h-4" />
                                                    <span>Upload Resume</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
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

            {/* Remove Resume Confirmation Dialog */}
            <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Remove Resume
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 pt-1">
                            Are you sure you want to remove your resume? Some job applications require a resume on file before you can apply.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRemoveDialogOpen(false)}
                            className="rounded-xl text-xs"
                            disabled={removeLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleRemoveResume}
                            disabled={removeLoading}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs"
                        >
                            {removeLoading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                    Removing...
                                </>
                            ) : (
                                'Confirm Remove'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </>
    );
}

export default Profile;
