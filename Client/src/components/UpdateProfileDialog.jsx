import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Loader2, Camera, User, Mail, Phone, FileText, Sparkles } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { setUser } from '@/redux/authSlice'
import { toast } from 'sonner'

const UpdateProfileDialog = ({ open, setOpen }) => {
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);

    const { user } = useSelector(store => store.auth);

    const [input, setInput] = useState({
        fullname: user?.fullname || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        bio: user?.profile?.bio || "",
        skills: Array.isArray(user?.profile?.skills) ? user.profile.skills.join(", ") : (user?.profile?.skills || ""),
        file: null,  // resume file
    });

    useEffect(() => {
        if (open && user) {
            setInput({
                fullname: user?.fullname || "",
                email: user?.email || "",
                phoneNumber: user?.phoneNumber || "",
                bio: user?.profile?.bio || "",
                skills: Array.isArray(user?.profile?.skills) ? user.profile.skills.join(", ") : (user?.profile?.skills || ""),
                file: null,
            });
        }
    }, [open, user]);

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const fileChangeHandler = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error(`File size exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 5 MB.`);
            e.target.value = '';
            return;
        }

        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedExtensions.includes(ext) && !allowedMimes.includes(file.type)) {
            toast.error('Unsupported file format. Only PDF and Word documents (.doc, .docx) are allowed.');
            e.target.value = '';
            return;
        }

        setInput({ ...input, file });
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('fullname', input.fullname);
            formData.append('email', input.email);
            formData.append('phoneNumber', input.phoneNumber);
            formData.append('bio', input.bio);
            formData.append('skills', input.skills);
            if (input.file) {
                formData.append('file', input.file);
                // Mark this upload as a resume (not photo)
                formData.append('uploadType', 'resume');
            }

            const response = await axios.post(`${USER_API_END_POINT}/profile/update`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true
            });

            if (response.data.success) {
                dispatch(setUser(response.data.user));
                toast.success("Profile updated successfully ✅");
            }

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    return (
        <Dialog open={open}>
            <DialogContent
                className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border-0 shadow-2xl"
                onInteractOutside={() => setOpen(false)}
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-5">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Update Profile
                        </DialogTitle>
                        <p className="text-white/80 text-sm mt-1">Keep your profile fresh and up to date</p>
                    </DialogHeader>
                </div>

                <form onSubmit={submitHandler} className="px-6 py-4">
                    <div className="space-y-4">

                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                name="fullname"
                                type="text"
                                placeholder="Your full name"
                                value={input.fullname}
                                onChange={changeEventHandler}
                                className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={input.email}
                                onChange={changeEventHandler}
                                className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <Label htmlFor="number" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                Phone Number
                            </Label>
                            <Input
                                id="number"
                                name="phoneNumber"
                                type="tel"
                                placeholder="+91 99999 99999"
                                value={input.phoneNumber}
                                onChange={changeEventHandler}
                                className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-1.5">
                            <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
                                Bio
                            </Label>
                            <Input
                                id="bio"
                                name="bio"
                                placeholder="A short bio about yourself..."
                                value={input.bio}
                                onChange={changeEventHandler}
                                className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                            />
                        </div>

                        {/* Skills */}
                        <div className="space-y-1.5">
                            <Label htmlFor="skills" className="text-sm font-semibold text-gray-700">
                                Skills
                            </Label>
                            <Input
                                id="skills"
                                name="skills"
                                placeholder="e.g. React, Node.js, Python (comma separated)"
                                value={input.skills}
                                onChange={changeEventHandler}
                                className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                            />
                        </div>

                        {/* Resume Upload */}
                        <div className="space-y-1.5">
                            <Label htmlFor="file" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                Resume (PDF or DOC/DOCX • Max 5MB)
                            </Label>
                            <div className="relative">
                                <Input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={fileChangeHandler}
                                    className="rounded-xl border-gray-200 border-dashed focus:border-indigo-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-medium hover:file:bg-indigo-100"
                                />
                            </div>
                            {input.file && (
                                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                    ✅ {typeof input.file === 'string' ? 'Resume uploaded' : input.file.name}
                                </p>
                            )}
                        </div>

                        {/* Profile Photo info note */}
                        <div className="flex items-start gap-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                            <Camera className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-indigo-700">
                                To update your <strong>profile photo</strong>, click on your avatar on the profile page — you can upload any image directly!
                            </p>
                        </div>

                    </div>

                    <DialogFooter className="mt-6">
                        <div className="flex gap-3 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            {loading ? (
                                <Button disabled className="flex-1 rounded-xl bg-indigo-600">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-sm"
                                >
                                    Save Changes
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default UpdateProfileDialog;
