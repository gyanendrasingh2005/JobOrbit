import { Company } from "../models/company.models.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const registerCompany = async (req, res) => {
    try {

        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required",
                success: false,
            })
        }

        let company = await Company.findOne({ companyName: companyName });
        if (company) {
            return res.status(400).json({
                message: "Company already exists",
                success: false,
            })
        }

        company = await Company.create({
            companyName: companyName,
            userId: req.id,
        })

        return res.status(201).json({
            message: "Company registered successfully",
            company,
            success: true,
        })



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}

import mongoose from "mongoose";

export const getCompanyDetailsByUser = async (req, res) => {
    try {
        const userId = req.id;
        const companies = await Company.find({ userId: userId });

        if (!companies) {
            return res.status(404).json({
                message: "No company found",
                success: false,
            });
        }

        return res.status(200).json({
            message: 'Companies found',
            companies: companies || [],
            success: true,
        });

    } catch (error) {
        console.error("GetCompanyDetailsByUser error:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch company details",
            success: false,
        });
    }
};

// get informations/details of a particular company
export const getCompanyDetailsById = async (req, res) => {
    try {
        const companyId = req.params.id;

        if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({
                message: "Valid Company ID is required",
                success: false,
            });
        }

        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                message: "No company found",
                success: false,
            });
        }

        return res.status(200).json({
            company,
            success: true,
        });

    } catch (error) {
        console.error("GetCompanyDetailsById error:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch company",
            success: false,
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const companyId = req.params.id;

        if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({
                message: "Valid Company ID is required",
                success: false,
            });
        }

        const existingCompany = await Company.findById(companyId);
        if (!existingCompany) {
            return res.status(404).json({
                message: "Company not found",
                success: false,
            });
        }

        // Authorize: ensure logged-in user owns this company
        if (existingCompany.userId.toString() !== req.id.toString()) {
            return res.status(403).json({
                message: "Unauthorized: You do not have permission to update this company",
                success: false,
            });
        }

        const { companyName, description, website, location } = req.body;
        const file = req.file;

        // cloudinary
        let logo = existingCompany.logo;

        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            logo = cloudResponse.secure_url;
        }

        const updateData = {};
        if (companyName !== undefined) updateData.companyName = companyName;
        if (description !== undefined) updateData.description = description;
        if (website !== undefined) updateData.website = website;
        if (location !== undefined) updateData.location = location;
        if (logo !== undefined) updateData.logo = logo;

        const company = await Company.findByIdAndUpdate(companyId, updateData, { new: true });

        return res.status(200).json({
            message: "Company information updated",
            company,
            success: true,
        });

    } catch (error) {
        console.error("UpdateCompany error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update company",
            success: false,
        });
    }
};


