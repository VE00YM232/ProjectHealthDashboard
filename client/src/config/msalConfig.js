/**
 * Project Name : KPI Dashboard
 * @company YMSLI
 * @author  Akanshu Raj
 * @date    Jan 08, 2026
 * Copyright (c) 2026, Yamaha Motor Solutions (INDIA) Pvt Ltd.
 * 
 * Module: MSAL Configuration
 * Description
 * ----------------------------------------------------------------------------------- 
 * Contains the MSAL configuration for Microsoft SSO
 * 
 * -----------------------------------------------------------------------------------
 * 
 * Revision History
 * -----------------------------------------------------------------------------------
 * Modified By          Modified On         Description
 * Akanshu Raj          Jan 08, 2026        Initial Creation
 * -----------------------------------------------------------------------------------
 */

import { LogLevel } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig = {
    auth: {
        clientId: "de407cdb-fcfd-47c6-8bd7-534ae6e496cb", // Your Azure AD App Client ID
        authority: "https://login.microsoftonline.com/43a870de-bfc4-4dec-bfde-184bca10db27", // Your tenant ID - restricts login to your organization only
        redirectUri: "http://localhost:3000", // Must match the redirect URI in Azure AD
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: "localStorage", // Changed to localStorage for better persistence
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        return;
                }
            },
            logLevel: LogLevel.Warning,
        }
    }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
    scopes: ["User.Read"]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
