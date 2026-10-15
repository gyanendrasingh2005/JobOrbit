import { setSavedJobs } from '@/redux/jobSlice';
import { USER_API_END_POINT } from '@/utils/constant';
import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const useGetSavedJobs = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(store => store.auth);

    useEffect(() => {
        const fetchSavedJobs = async () => {
            if (!user) return;
            try {
                const response = await axios.get(`${USER_API_END_POINT}/bookmarks`, {
                    withCredentials: true,
                });
                if (response.data.success) {
                    dispatch(setSavedJobs(response.data.bookmarks));
                }
            } catch (error) {
                console.error("Error fetching saved jobs:", error);
            }
        };

        fetchSavedJobs();
    }, [dispatch, user]);
};

export default useGetSavedJobs;
