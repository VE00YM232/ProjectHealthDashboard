/**
 * Project Name : KPI Dashboard
 * @company YMSLI
 * @author  Divjyot Singh
 * @date    Sep 19, 2025
 * Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
 * Module: Database Connection (PostgreSQL)
 * Description
 * -----------------------------------------------------------------------------------
 * Provides a reusable PostgreSQL connection pool for the KPI Dashboard application.
 * 
 * -----------------------------------------------------------------------------------
 * 
 * Revision History
 * -----------------------------------------------------------------------------------
 * Modified By          Modified On         Description
 * Divjyot Singh        Sep 19, 2025        Initial Creation
 * -----------------------------------------------------------------------------------
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const PropertiesReader = require('properties-reader');
const logger = require('../config/logger');

// Load properties (env vars take priority, fallback to config.properties for local dev)
const configPath = path.join(__dirname, '../config.properties');
const properties = fs.existsSync(configPath) ? PropertiesReader(configPath) : null;
const getConfig = (key) => process.env[key] || (properties && properties.get(key));

// Create a pool of connections
const pool = new Pool({
  user: getConfig('DB_USER'),
  host: getConfig('DB_HOST'),
  database: getConfig('DB_NAME'),
  password: getConfig('DB_PASSWORD'),
  port: getConfig('DB_PORT'),
});

logger.info('Database connection pool created.');

module.exports = pool;
