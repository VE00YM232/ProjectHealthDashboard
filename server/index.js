/**
 * Project Name : KPI Dashboard
 * @company YMSLI
 * @author  Divjyot Singh
 * @date    Sep 19, 2025
 * Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
 * 
 * Module: KPI Server
 * Description
 * ----------------------------------------------------------------------------------- 
 * Contains the functions to Start KPI Server
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
const fs = require('fs');
const app = express();
const PropertiesReader = require('properties-reader');
const router = require('./routes/Router');
const cors = require("cors");
const session = require('express-session');
const { MigrationService } = require('./database/DatabaseService');
const logger = require('./config/logger');

// Helper: get config value from env var first, then fallback to properties file
const configPath = path.join(__dirname, '/config.properties');
const properties = fs.existsSync(configPath) ? PropertiesReader(configPath) : null;
const getConfig = (key) => process.env[key] || (properties && properties.get(key));

global.OneDriveUserId = getConfig("ONEDRIVE_USER_ID");
global.ClientId = getConfig("CLIENT_ID");
global.ClientSecret = getConfig("CLIENT_SECRET");
global.TenantId = getConfig("TENANT_ID");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: getConfig("SESSION_SECRET") || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use('/', router);

const port = properties.get("PORT");

app.listen(port, async () => {
  const url = `http://localhost:${port}`;
  logger.info(`Server running at ${url}`);
  
  // Run database migrations
  try {
    await MigrationService.AddCategoryDataColumn();
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', { error: error.message, stack: error.stack });
  }
});

