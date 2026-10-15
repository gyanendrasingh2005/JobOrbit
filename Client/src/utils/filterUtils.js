// Helper functions to filter jobs accurately across categories

export const filterCategories = [
    {
        key: "location",
        title: "Location",
        options: ["Delhi NCR", "Bengaluru", "Mumbai", "Hyderabad", "Pune", "Remote"],
    },
    {
        key: "industry",
        title: "Industry / Role",
        options: [
            "Full Stack Developer",
            "Frontend Developer",
            "Backend Developer",
            "Data Science / AI",
            "Cloud & DevOps",
        ],
    },
    {
        key: "salary",
        title: "Salary",
        options: ["0 - 6 LPA", "6 - 15 LPA", "15 - 30 LPA", "30 - 50 LPA", "50+ LPA"],
    },
    {
        key: "jobType",
        title: "Job Type",
        options: ["Full Time", "Part Time", "Internship", "Contract"],
    },
];

export const matchSalary = (jobSalary, filterSalary) => {
    if (!filterSalary) return true;
    const num = Number(jobSalary);
    if (isNaN(num)) return false;
    const lpa = num > 1000 ? num / 100000 : num;

    switch (filterSalary) {
        case "0 - 6 LPA":
            return lpa <= 6;
        case "6 - 15 LPA":
            return lpa >= 6 && lpa <= 15;
        case "15 - 30 LPA":
            return lpa >= 15 && lpa <= 30;
        case "30 - 50 LPA":
            return lpa >= 30 && lpa <= 50;
        case "50+ LPA":
            return lpa >= 50;
        default:
            return true;
    }
};

export const matchLocation = (jobLocation, filterLocation) => {
    if (!filterLocation) return true;
    const loc = (jobLocation || "").toLowerCase();
    const fl = filterLocation.toLowerCase();

    if (fl === "delhi ncr") {
        return (
            loc.includes("delhi") ||
            loc.includes("ncr") ||
            loc.includes("noida") ||
            loc.includes("gurugram") ||
            loc.includes("gurgaon") ||
            loc.includes("ghaziabad") ||
            loc.includes("faridabad")
        );
    }
    if (fl === "bengaluru") {
        return (
            loc.includes("bengaluru") ||
            loc.includes("bangalore") ||
            loc.includes("bengluru")
        );
    }
    if (fl === "mumbai") {
        return (
            loc.includes("mumbai") ||
            loc.includes("navi mumbai") ||
            loc.includes("thane")
        );
    }
    if (fl === "hyderabad") {
        return loc.includes("hyderabad") || loc.includes("secunderabad");
    }
    if (fl === "pune") {
        return loc.includes("pune");
    }
    if (fl === "remote") {
        return loc.includes("remote") || loc.includes("work from home");
    }
    return loc.includes(fl);
};

export const matchIndustry = (job, filterIndustry) => {
    if (!filterIndustry) return true;
    const title = (job?.title || "").toLowerCase();
    const desc = (job?.description || "").toLowerCase();
    const reqs = Array.isArray(job?.requirements)
        ? job.requirements.join(" ").toLowerCase()
        : (job?.requirements || "").toLowerCase();
    const text = `${title} ${desc} ${reqs}`;
    const fi = filterIndustry.toLowerCase();

    if (fi.includes("full stack")) {
        return (
            text.includes("full stack") ||
            text.includes("fullstack") ||
            text.includes("full-stack")
        );
    }
    if (fi.includes("frontend")) {
        return (
            text.includes("frontend") ||
            text.includes("front-end") ||
            text.includes("front end") ||
            text.includes("react") ||
            text.includes("ui")
        );
    }
    if (fi.includes("backend")) {
        return (
            text.includes("backend") ||
            text.includes("back-end") ||
            text.includes("back end") ||
            text.includes("node") ||
            text.includes("express") ||
            text.includes("java") ||
            text.includes("python")
        );
    }
    if (fi.includes("data science") || fi.includes("ai")) {
        return (
            text.includes("data science") ||
            text.includes("data scientist") ||
            text.includes("machine learning") ||
            text.includes("ai") ||
            text.includes("data analyst")
        );
    }
    if (fi.includes("cloud") || fi.includes("devops")) {
        return (
            text.includes("cloud") ||
            text.includes("devops") ||
            text.includes("aws") ||
            text.includes("solution") ||
            text.includes("azure") ||
            text.includes("docker")
        );
    }
    return text.includes(fi);
};

export const matchJobType = (jobType, filterJobType) => {
    if (!filterJobType) return true;
    const jt = (jobType || "").toLowerCase();
    const fjt = filterJobType.toLowerCase();

    if (fjt.includes("full")) return jt.includes("full");
    if (fjt.includes("part")) return jt.includes("part");
    if (fjt.includes("intern")) return jt.includes("intern");
    if (fjt.includes("contract")) return jt.includes("contract");
    return jt.includes(fjt);
};

export const matchKeyword = (job, keyword) => {
    if (!keyword || !keyword.trim()) return true;
    const kw = keyword.toLowerCase().trim();
    const title = (job?.title || "").toLowerCase();
    const desc = (job?.description || "").toLowerCase();
    const loc = (job?.location || "").toLowerCase();
    const company = (job?.company?.companyName || "").toLowerCase();
    const reqs = Array.isArray(job?.requirements)
        ? job.requirements.join(" ").toLowerCase()
        : (job?.requirements || "").toLowerCase();

    return (
        title.includes(kw) ||
        desc.includes(kw) ||
        loc.includes(kw) ||
        company.includes(kw) ||
        reqs.includes(kw)
    );
};
