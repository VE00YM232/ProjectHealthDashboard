/**
 * Project Name : KPI Dashboard
 * @company YMSLI
 * @author  Divjyot Singh
 * @date    Sep 19, 2025
 * Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
 * 
 * Module: KPI Server Routes
 * Description
 * ----------------------------------------------------------------------------------- 
 * Contains the routes for the KPI Server
 * 
 * -----------------------------------------------------------------------------------
 * 
 * Revision History
 * -----------------------------------------------------------------------------------
 * Modified By          Modified On         Description
 * Divjyot Singh        Sep 19, 2025        Initial Creation
 * -----------------------------------------------------------------------------------
 */

const express = require('express');
const path = require('path');
const { GetKpiDataForAllReleases, CheckLogin } = require('../service/MappingForFrontend');
const router = express.Router();
const { InitializeDatabaseForMonth, InitializeDatabaseFromOneDrive, GetBugAnalysisData } = require('../service/KpiDataSyncing');
const { SyncMetadataService } = require('../database/DatabaseService');

// Route to fetch all KPI data
router.get('/getAllKPIData', async (req, res) => {
    try {
        let data = await GetKpiDataForAllReleases();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: 'error', error: err.message });
    }
});

// Route to sync all KPI data from filesystem to database
router.get('/syncAllKPIData', async (req, res) => {
    try {
        await InitializeDatabaseFromOneDrive();
        await SyncMetadataService.SaveLastSyncTime(new Date());
        res.status(200).json({ message: 'success' });
    }
    catch (err) {
        res.status(500).json({ message: 'error', error: err.message });
    }
});

// Route to sync KPI data for a specific month
router.post('/uploadMonthKPIData', async (req, res) => {
    try {
        const { year, month } = req.body;
        if (!year || !month) {
            return res.status(400).json({ message: 'Year and Month are required' });
        }
        await InitializeDatabaseForMonth();
        await SyncMetadataService.SaveLastSyncTime(new Date());
        res.status(200).json({ message: 'success' });
    }
    catch (err) {
        res.status(500).json({ message: 'error', error: err.message });
    }

});

// Route to get the last sync timestamp
router.get('/getLastSyncTime', async (req, res) => {
    try {
        const syncData = await SyncMetadataService.GetLastSyncTime();
        if (syncData) {
            res.status(200).json({ 
                message: 'success', 
                lastSyncTime: syncData.value,
                updatedAt: syncData.updated_at
            });
        } else {
            res.status(200).json({ 
                message: 'success', 
                lastSyncTime: null
            });
        }
    }
    catch (err) {
        res.status(500).json({ message: 'error', error: err.message });
    }
});
// route to check login credentials
router.post("/checkLogin",async (req, res) => {
    const { username, password } = req.body;
    const loginResult = await CheckLogin(username, password);
    if (loginResult.success) {
        res.status(200).json({ message: "Login successful" });
    } else {
        res.status(401).json({ message: "Invalid username or password" });
    }
});
// route to get bug analysis data
router.post("/getBugAnalysisData", async (req, res) => {
    try {
        const bugAnalysisData = await GetBugAnalysisData(req.body);
        res.status(200).json(bugAnalysisData);
    } catch (err) {
        res.status(500).json({ message: 'error', error: err.message });
    }
});

// SSO Authentication Routes (Client-side only, no server-side MSAL needed)

// Route to get current user session (for client to store session after SSO)
router.post('/auth/session', async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Store user session
    req.session.user = {
        name: name,
        email: email,
        loginTime: new Date().toISOString()
    };
    
    res.json({ 
        success: true, 
        message: 'Session created successfully',
        user: req.session.user
    });
});

// Route to get current user session
router.get('/auth/user', async (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: {
                name: req.session.user.name,
                email: req.session.user.email
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Route to logout
router.post('/auth/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'error', error: err.message });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
