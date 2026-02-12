/**
 * Project Name : KPI Dashboard
 * @company YMSLI
 * @author  Divjyot Singh
 * @date    Sep 19, 2025
 * Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
 * Module: Database Service
 * Description
 * -----------------------------------------------------------------------------------
 * Provides service functions for interacting with Projects, Releases, and KPI Reports tables.
 * 
 * -----------------------------------------------------------------------------------
 * 
 * Revision History
 * -----------------------------------------------------------------------------------
 * Modified By          Modified On         Description
 * Divjyot Singh        Sep 19, 2025        Initial Creation
 * -----------------------------------------------------------------------------------
 */

global.db = require('./DatabaseConnection');
const logger = require('../config/logger');

// ===================== Projects =====================
const ProjectService = {
  /**
   * Function to create a new project
   * @param {*} projectName Name of the project
   */
  CreateProject: async (projectName) => {
    const query = `
      INSERT INTO projects (project_name)
      VALUES ($1)
      RETURNING *;
    `;
    const { rows } = await global.db.query(query, [projectName]);
    return rows[0];
  },

  /**
   * Function to get all projects
   */
  GetAllProjects: async () => {
    const { rows } = await global.db.query(`SELECT * FROM projects;`);
    return rows;
  },

  /**
   * Function to check login credentials
   * @param {*} username 
   * @param {*} password 
   * @returns Boolean
   */
  CheckLoginCredentials: async (username, password) => {
    try{
      const query = `SELECT * FROM users WHERE username = $1 AND password = $2;`;
      const { rows } = await global.db.query(query, [username, password]);
      return rows.length > 0;
    }
    catch(err){
      return false;
    }
  },
  /**
   * Function to delete all projects
   */
  DeleteKpiProjects: async () => {
    const query = `DELETE FROM projects;`;
    await global.db.query(query);
  }
};

// ===================== Releases =====================
const ReleaseService = {
    /**
     * Function to create a new release
     * @param {*} projectId Id of the project
     * @param {*} year year of the release
     * @param {*} month month of the release
     * @param {*} releasePhase Phase of the release
     * @param {*} releaseName Name of the release
     */
    CreateRelease: async (projectId, year, month, releasePhase, releaseName) => {
        const query = `
      INSERT INTO releases (project_id, year, month, release_phase, release_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const { rows } = await global.db.query(query, [
            projectId,
            year,
            month,
            releasePhase,
            releaseName
        ]);
        return rows[0];
    },

    /**
     * Function to get all releases for a specific month and year
     * @param {*} year year of the release
     * @param {*} month month of the release
     */
    GetAllReleasesByMonth: async (year, month) => {
        const query = `
            SELECT * FROM releases
            WHERE year = $1 AND month = $2;
        `;
        const { rows } = await global.db.query(query, [year, month]);
        return rows;
    },

    /**
     * Function to get all releases
     */
    GetAllReleases: async () => {
        const { rows } = await global.db.query(`SELECT * FROM releases;`);
        return rows;
    },
    /**
     * Function to delete all releases
     */
    DeleteKpiRelease: async (releaseIds = [], year = null, month = null) => {
      try {
        let query;
        let params = [];

        //   Delete by specific release IDs (highest priority)
        if (Array.isArray(releaseIds) && releaseIds.length > 0) {
          const placeholders = releaseIds.map((_, i) => `$${i + 1}`).join(", ");
          query = `DELETE FROM releases WHERE release_id IN (${placeholders});`;
          params = releaseIds;
          logger.info(`Deleting ${releaseIds.length} release(s) by ID`);
        }

        //   Delete by Year + Month
        else if (year && month) {
          query = `DELETE FROM releases WHERE year = $1 AND month = $2;`;
          params = [year, month];
          logger.info(`Deleting releases for ${month}/${year}`);
        }

        //   Delete by Year only
        else if (year) {
          query = `DELETE FROM releases WHERE year = $1;`;
          params = [year];
          logger.info(`Deleting all releases for year ${year}`);
        }

        //   Delete All (fallback)
        else {
          query = `DELETE FROM releases;`;
          logger.warn('No filters applied — deleting ALL releases');
        }

        const result = await global.db.query(query, params);
        logger.info(`Delete operation completed. ${result.rowCount} release(s) deleted`);

        return result.rowCount;
      } catch (error) {
        logger.error('Error deleting releases:', { error: error.message, stack: error.stack });
        throw error;
      }
    },


};

// ===================== KPI Reports =====================
const KpiReportService = {
    
    /**
     * Function to create a new KPI report
     * @param {*} releaseId Id of the release
     * @param {*} data KPI data object of this particular release
     */
    CreateKpiReport: async (releaseId, data) => {
        const query = `
          INSERT INTO kpi_reports (
            release_id, ia_change_deliverables, ia_bugs, loc, code_review_bugs, coding_bugs,
            ut_deliverables, ut_bugs, it_deliverables, it_bugs, srs_deliverables,
            srs_bugs, sdd_bugs, man_days, engineering_efforts,urs_deliverables, urs_bugs, wrike_deliverables, wrike_bugs,
            system_test_deliverables, ntke_bugs, estimation_cost, man_month, critical_bugs, major_bugs, minor_bugs, low_bugs, system_test_requirement_bugs, system_test_design_bugs, system_test_coding_bugs, system_test_ut_bugs, system_test_code_review_bugs, system_test_integration_bugs,
            integration_testing_bugs, uat_bugs, go_live_bugs,
            previous_phase_bugs, current_phase_bugs, category_data, open_points
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
          )
          RETURNING *;
        `;

        // Inline function to parse KLOC
        const parseKloc = (value) => {
            if (!value) return 0;
            if (typeof value === "number") return value;
            const lower = value.toString().toLowerCase().trim();
            if (lower.endsWith("k")) {
                const num = parseFloat(lower.slice(0, -1));
                return isNaN(num) ? 0 : num * 1000;
            }
            const num = parseFloat(lower);
            return isNaN(num) ? 0 : num;
        };

        const values = [
            releaseId,
            data.iaChangeDeliverables || 0,
            data.iaBugs || 0,
            parseKloc(data.loc), 
            data.codeReviewBugs || 0,
            data.codingBugs || 0,
            data.utDeliverables || 0,
            data.utBugs || 0,
            data.itDeliverables || 0,
            data.itBugs || 0,
            data.srsDeliverables || 0,
            data.srsBugs || 0,
            data.sddBugs || 0,
            data.manDays || 0,
            data.engineeringEfforts || 0,
            data.ursDeliverables || 0,
            data.ursBugs || 0,
            data.wrikeDeliverables || 0,
            data.wrikeBugs || 0,
            data.systemTestDeliverables || 0,
            data.ntkeBugs || 0,
            data.estimationCost || 0,
            data.manMonth || 0,
            data.criticalBugs || 0,
            data.majorBugs || 0,
            data.minorBugs || 0,
            data.lowBugs || 0,
            data.systemTestRequirementBugs || 0,
            data.systemTestDesignBugs || 0,
            data.systemTestCodingBugs || 0,
            data.systemTestUTBugs || 0,
            data.systemTestCodeReviewBugs || 0,
            data.systemTestIntegrationBugs || 0,
            data.integrationTestingBugs || 0,
            data.uatBugs || 0,
            data.goLiveBugs || 0,
            data.previousPhaseBugs || 0,
            data.currentPhaseBugs || 0,
            data.categoryData || '{}',
            data.openPoints || 0
        ];

        const { rows } = await global.db.query(query, values);
        return rows[0];
    },

    /**
     * Function to get all KPI reports for a specific month and year
     * @param {*} year year of the release
     * @param {*} month month of the release
     */
    GetAllKpiReportsByMonth: async (year, month) => {
        const query = `
            SELECT kr.*
            FROM kpi_reports kr
            INNER JOIN releases r ON kr.release_id = r.release_id
            WHERE r.year = $1 AND r.month = $2;
        `;
        const { rows } = await global.db.query(query, [year, month]);
        return rows;
    },

    /**
     * Function to get all KPI reports
     */
    GetAllKpiReports: async () => {
        const { rows } = await global.db.query(`SELECT * FROM kpi_reports;`);
        return rows;
    },

    /**
     * Function to delete KPI reports
     * @param {*} releaseIds Array of release IDs to delete reports for
     */
    DeleteKpiReports: async (releaseIds = []) => {
      try {
        let query;
        let params = [];

        if (Array.isArray(releaseIds) && releaseIds.length > 0) {
          const placeholders = releaseIds.map((_, i) => `$${i + 1}`).join(", ");
          query = `DELETE FROM kpi_reports WHERE release_id IN (${placeholders});`;
          params = releaseIds;
          logger.info(`Deleting ${releaseIds.length} KPI report(s) for release IDs: [${releaseIds.join(", ")}]`);
        } else {
          query = `DELETE FROM kpi_reports;`;
          logger.warn('No release IDs provided — deleting ALL KPI reports');
        }

        const result = await global.db.query(query, params);
        logger.info(`KPI report deletion complete. ${result.rowCount} record(s) removed`);

        return result.rowCount;
      } catch (error) {
        logger.error('Error deleting KPI reports:', { error: error.message, stack: error.stack });
        throw error;
      }
    },

};

// ===================== Sync Metadata =====================
const SyncMetadataService = {
  /**
   * Function to save the last sync timestamp
   * @param {Date} timestamp The timestamp of the last sync
   */
  SaveLastSyncTime: async (timestamp) => {
    try {
      // Create table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key VARCHAR(50) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await global.db.query(createTableQuery);

      // Insert or update the last sync time
      const query = `
        INSERT INTO sync_metadata (key, value, updated_at)
        VALUES ('last_sync_time', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) 
        DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      const { rows } = await global.db.query(query, [timestamp.toISOString()]);
      logger.info('Last sync time saved:', { value: rows[0].value });
      return rows[0];
    } catch (error) {
      logger.error('Error saving sync time:', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  /**
   * Function to get the last sync timestamp
   * @returns {Object|null} The sync metadata object or null if not found
   */
  GetLastSyncTime: async () => {
    try {
      // Create table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key VARCHAR(50) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await global.db.query(createTableQuery);

      const query = `SELECT * FROM sync_metadata WHERE key = 'last_sync_time';`;
      const { rows } = await global.db.query(query);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error getting sync time:', { error: error.message, stack: error.stack });
      throw error;
    }
  }
};

// ===================== Database Migration =====================
const MigrationService = {
  /**
   * Add category_data column to kpi_reports table if it doesn't exist
   */
  AddCategoryDataColumn: async () => {
    try {
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='kpi_reports' AND column_name='category_data';
      `;
      const { rows } = await global.db.query(checkColumnQuery);
      
      if (rows.length === 0) {
        logger.info('Adding category_data column to kpi_reports table');
        const addColumnQuery = `
          ALTER TABLE kpi_reports 
          ADD COLUMN category_data TEXT DEFAULT '{}';
        `;
        await global.db.query(addColumnQuery);
        logger.info('category_data column added successfully');
      } else {
        logger.info('category_data column already exists');
      }
    } catch (error) {
      logger.error('Error adding category_data column:', { error: error.message, stack: error.stack });
      throw error;
    }
  }
};

module.exports = {
  ProjectService,
  ReleaseService,
  KpiReportService,
  SyncMetadataService,
  MigrationService
};
