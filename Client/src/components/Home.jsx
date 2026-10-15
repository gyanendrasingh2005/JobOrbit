import React, { useEffect } from 'react'
import Navbar from './shared/Navbar'
import HeroSection from './HeroSection'
import CompanySlider from './CompanySlider'
import CategorySection from './CategorySection'
import LatestJobs from './LatestJobs'
import HowItWorks from './HowItWorks'
import PlatformFeatures from './PlatformFeatures'
import CareerStats from './CareerStats'
import CtaBanner from './CtaBanner'
import Footer from './shared/Footer'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const navigate = useNavigate()
    useGetAllJobs()
    const { user } = useSelector((store) => store.auth)

    useEffect(() => {
        if (user?.role === 'recruiter') {
            navigate('/admin/companies')
        }
    }, [user, navigate])

    return (
        <div className="min-h-screen bg-white flex flex-col antialiased selection:bg-purple-100 selection:text-purple-900">
            <Navbar />
            <main className="flex-1">
                <HeroSection />
                <CompanySlider />
                <CategorySection />
                <LatestJobs />
                <HowItWorks />
                <PlatformFeatures />
                <CareerStats />
                <CtaBanner />
            </main>
            <Footer />
        </div>
    )
}

export default Home
