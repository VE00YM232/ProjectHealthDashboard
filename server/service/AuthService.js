/**
 * Project Name : KPI Dashboard
 * @company YMSLI
 * @author  Akanshu Raj
 * @date    Jan 08, 2026
 * Copyright (c) 2026, Yamaha Motor Solutions (INDIA) Pvt Ltd.
 * 
 * Module: Authentication Service
 * Description
 * ----------------------------------------------------------------------------------- 
 * Contains the functions for Microsoft SSO Authentication
 * 
 * -----------------------------------------------------------------------------------
 * 
 * Revision History
 * -----------------------------------------------------------------------------------
 * Modified By          Modified On         Description
 * Akanshu Raj          Jan 08, 2026        Initial Creation
 * -----------------------------------------------------------------------------------
 */

const msal = require('@azure/msal-node');
const logger = require('../config/logger');

// MSAL Configuration
const msalConfig = {
    auth: {
        clientId: global.ClientId,
        authority: `https://login.microsoftonline.com/${global.TenantId}`,
        clientSecret: global.ClientSecret,
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                logger.debug(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Get authorization URL for Microsoft login
 * @param {string} redirectUri - The redirect URI after authentication
 * @returns {Promise<string>} Authorization URL
 */
async function getAuthUrl(redirectUri) {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: redirectUri,
    };

    try {
        const response = await cca.getAuthCodeUrl(authCodeUrlParameters);
        return response;
    } catch (error) {
        logger.error('Error getting auth URL:', { error: error.message, stack: error.stack });
        throw error;
    }
}

/**
 * Acquire token using authorization code
 * @param {string} code - Authorization code from Microsoft
 * @param {string} redirectUri - The redirect URI
 * @returns {Promise<Object>} Token response with access token and account info
 */
async function acquireTokenByCode(code, redirectUri) {
    const tokenRequest = {
        code: code,
        scopes: ["user.read"],
        redirectUri: redirectUri,
    };

    try {
        const response = await cca.acquireTokenByCode(tokenRequest);
        return response;
    } catch (error) {
        logger.error('Error acquiring token:', { error: error.message, stack: error.stack });
        throw error;
    }
}

/**
 * Validate access token
 * @param {string} accessToken - Access token to validate
 * @returns {Promise<boolean>} Whether token is valid
 */
async function validateToken(accessToken) {
    try {
        // In production, you would verify the token signature and claims
        // For now, we'll do a simple check
        if (!accessToken || accessToken.length === 0) {
            return false;
        }
        return true;
    } catch (error) {
        logger.error('Error validating token:', { error: error.message, stack: error.stack });
        return false;
    }
}

/**
 * Get user info from Microsoft Graph API
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} User information
 */
async function getUserInfo(accessToken) {
    try {
        const fetch = require('isomorphic-fetch');
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo = await response.json();
        return userInfo;
    } catch (error) {
        logger.error('Error getting user info:', { error: error.message, stack: error.stack });
        throw error;
    }
}

module.exports = {
    getAuthUrl,
    acquireTokenByCode,
    validateToken,
    getUserInfo
};
