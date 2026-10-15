import { setAllJobs } from '@/redux/jobSlice'
import { JOB_API_END_POINT } from '@/utils/constant'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const useGetAllJobs = () => {
    const dispatch = useDispatch();
    const { searchedQuery } = useSelector(store => store.job)

    useEffect(() => {
        const fetchAllJobs = async () => {
            try {
                const queryParam = searchedQuery ? `?keyword=${encodeURIComponent(searchedQuery)}` : '';
                const response = await axios.get(`${JOB_API_END_POINT}/get${queryParam}`, {
                    withCredentials: true
                });
                if (response.data.success) {
                    dispatch(setAllJobs(response.data.jobs || []))
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchAllJobs();
    }, [searchedQuery, dispatch])
}

export default useGetAllJobs
