import { createSlice } from "@reduxjs/toolkit";

const jobSlice = createSlice({
    name: "job",
    initialState: {
        allJobs: [],
        allAdminJobs: [],
        singleJob: null,
        searchJobByText: "",
        allAppliedJobs: [],
        savedJobs: [],
        searchedQuery: "",
        filters: {
            location: "",
            industry: "",
            salary: "",
            jobType: "",
        }
    },
    reducers: {
        // actions
        setAllJobs: (state, action) => {
            state.allJobs = action.payload;
        },
        setSingleJob: (state, action) => {
            state.singleJob = action.payload;
        },
        setAllAdminJobs: (state, action) => {
            state.allAdminJobs = action.payload;
        },
        setSearchJobByText: (state, action) => {
            state.searchJobByText = action.payload;
        },
        setAllAppliedJobs: (state, action) => {
            state.allAppliedJobs = action.payload;
        },
        setSavedJobs: (state, action) => {
            state.savedJobs = action.payload;
        },
        setSearchedQuery: (state, action) => {
            state.searchedQuery = action.payload;
        },
        setJobFilter: (state, action) => {
            const { key, value } = action.payload;
            state.filters[key] = value;
        },
        clearAllFilters: (state) => {
            state.filters = {
                location: "",
                industry: "",
                salary: "",
                jobType: "",
            };
            state.searchedQuery = "";
        }
    }
});


export const { 
    setAllJobs, 
    setSingleJob, 
    setAllAdminJobs, 
    setSearchJobByText, 
    setAllAppliedJobs, 
    setSavedJobs,
    setSearchedQuery,
    setJobFilter,
    clearAllFilters
} = jobSlice.actions;

export default jobSlice.reducer;