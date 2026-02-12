/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 24, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: KPI Data Builder Service
* Description
* -----------------------------------------------------------------------------------
* Provides service related to building KPI data from release folders and Excel files
* 
* -----------------------------------------------------------------------------------
* 
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 24, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/

const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");
const ReleaseFolderService = require("./ProjectReadingService");
const { ProjectService, ReleaseService, KpiReportService } = require("../database/DatabaseService");
const { ReadDlsExcelFromOneDrive, ReadTestReportExcelFromOneDrive, ReadEstimationExcelFromOneDrive } = require("./ReportReadingService");
const logger = require('../config/logger');
let limit;
(async () => {
  const pLimit = (await import("p-limit")).default;
  limit = pLimit(5);
})();
  
// Map month strings to numbers
const monthMap = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
};

/**
 * Function to convert month string to number
 * @param {*} monthStr Name or number of the month (e.g., "Jan", "February", "03", "12")
 */
function GetMonthNumber(monthStr) {
  if (!monthStr) return null;

  // Normalize → lowercase & trim
  const normalized = monthStr.toString().trim().toLowerCase();

  // If already numeric like "09" or "12"
  if (!isNaN(normalized)) {
    return parseInt(normalized, 10);
  }

  return monthMap[normalized] || null;
}

// Global store
const DlsResultsMap = new Map();

//  Initialize database by scanning OneDrive hierarchy
async function InitializeDatabaseFromOneDrive() {
  try {
    const credential = new ClientSecretCredential(global.TenantId, global.ClientId, global.ClientSecret);
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
          return tokenResponse.token;
        },
      },
    });
    await TraverseOneDrive(client, `/users/${global.OneDriveUserId}/drive/root/children`);
  } catch (err) {
    logger.error('Error initializing database from OneDrive:', { error: err.message, stack: err.stack });
  }
}

/**
 *  Recursively traverses folders and collects Excel data
 */
async function TraverseOneDrive(client, filters = {}) {
  const { yearFilter, monthFilter } = filters;
  try {
    logger.info('Starting optimized OneDrive traversal under IM');

    const rootItems = (await client.api(`/users/${global.OneDriveUserId}/drive/root/children`).get()).value || [];
    const releasesFolder = rootItems.find(f => f.folder && f.name.toLowerCase() === "im");
    if (!releasesFolder) {
      logger.warn('IM folder not found. Traversal stopped');
      return;
    }

    // --- Level 1: Year folders ---
    let yearFolders = (await client.api(`/users/${global.OneDriveUserId}/drive/items/${releasesFolder.id}/children`).get()).value
      ?.filter(f => f.folder && /^\d{4}$/.test(f.name)) || [];

    // 🔹 Apply year filter if provided
    if (yearFilter) {
      yearFolders = yearFolders.filter(y => y.name === yearFilter);
      if (yearFolders.length === 0) {
        logger.warn(`Year folder ${yearFilter} not found`);
        return;
      }
    }

    for (const yearFolder of yearFolders) {
      // --- Level 2: Month folders ---
      let monthFolders = (await client.api(`/users/${global.OneDriveUserId}/drive/items/${yearFolder.id}/children`).get()).value
        ?.filter(f => f.folder && /^[A-Za-z]{3,9}$/.test(f.name)) || [];

      // 🔹 Apply month filter if provided
      if (monthFilter) {
        const normalizedMonth = monthFilter.toLowerCase().slice(0, 3); // e.g., 'nov'
        monthFolders = monthFolders.filter(m => m.name.toLowerCase().startsWith(normalizedMonth));
        if (monthFolders.length === 0) {
          logger.warn(`Month folder ${monthFilter} not found under year ${yearFolder.name}`);
          continue;
        }
      }

      // Continue your existing traversal logic
      await Promise.all(
        monthFolders.map(monthFolder =>
          limit(async () => {
            // process projects/releases/documents
            const projectFolders = (await client.api(`/users/${global.OneDriveUserId}/drive/items/${monthFolder.id}/children`).get()).value
              ?.filter(f => f.folder) || [];

            for (const projectFolder of projectFolders) {
              const releaseFolders = (await client.api(`/users/${global.OneDriveUserId}/drive/items/${projectFolder.id}/children`).get()).value
                ?.filter(f => f.folder) || [];

              for (const releaseFolder of releaseFolders) {
                const documentsFolders = (await client.api(`/users/${global.OneDriveUserId}/drive/items/${releaseFolder.id}/children`).get()).value
                  ?.filter(f => f.folder && f.name.toLowerCase() === "documents") || [];

                for (const documentsFolder of documentsFolders) {
                  const subFolders = (await client.api(`/users/${global.OneDriveUserId}/drive/items/${documentsFolder.id}/children`).get()).value
                    ?.filter(f =>
                      ["defect log sheet", "testing report", "estimation"].includes(f.name.toLowerCase())
                    ) || [];

                  await Promise.all(
                    subFolders.map(subFolder =>
                      limit(async () => {
                        const files = (await client.api(`/users/${global.OneDriveUserId}/drive/items/${subFolder.id}/children`).get()).value
                          ?.filter(f => /\.(xlsx|xlsm)$/i.test(f.name)) || [];

                        for (const file of files) {
                          await ProcessExcelFile(client, file, [
                            "IM",
                            yearFolder.name,
                            monthFolder.name,
                            projectFolder.name,
                            releaseFolder.name,
                            "Documents",
                            subFolder.name,
                          ]);
                        }
                      })
                    )
                  );
                }
              }
            }
          })
        )
      );
    }

    logger.info('OneDrive traversal complete');
  } catch (error) {
    logger.error('Optimized traversal failed:', { error: error.message, stack: error.stack });
  }
}


/**
 *  Processes Excel files (DLS / TestReport / Estimation) and triggers KPI creation
 * @param {*} client Authenticated OneDrive client
 * @param {*} file OneDrive file object
 * @param {*} pathStack Array of folder names leading to the file
 */
async function ProcessExcelFile(client, file, pathStack) {
  const fileName = file.name.toLowerCase();

  //  Identify key hierarchy elements
  const year = pathStack.find((x) => /^\d{4}$/.test(x)); // 2024, 2025, etc.
  const month = pathStack.find((x) => /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(x));
  const release = pathStack.find((x) => /^release/i.test(x));
  
  // The project is likely the folder between month and release
  const monthIndex = pathStack.indexOf(month);
  const releaseIndex = pathStack.indexOf(release);
  const project = (monthIndex !== -1 && releaseIndex !== -1 && releaseIndex >= monthIndex + 2)
    ? pathStack[releaseIndex - 1]
    : null;

  if (!year || !month || !project || !release) {
    logger.warn(`Skipping ${file.name} — invalid or incomplete folder hierarchy`);
    return;
  }

  //  Get the parent folder name (last element in pathStack)
  const parentFolder = pathStack[pathStack.length - 1]?.toLowerCase();

  //  Detect file type - check folder name first, then filename
  let fileType = null;
  if (fileName.includes("dls")) fileType = "DLS";
  else if (fileName.includes("test")) fileType = "TestReport";
  else if (fileName.includes("estimation") || parentFolder === "estimation") fileType = "Estimation";

  if (!fileType) {
    logger.warn(`Skipping unrecognized file: ${file.name}`);
    return;
  }

  logger.info(`Found ${fileType} file: ${file.name} in ${year}/${month}/${project}/${release}`);

  //  Select correct reader function
  const readerMap = {
    DLS: ReadDlsExcelFromOneDrive,
    TestReport: ReadTestReportExcelFromOneDrive,
    Estimation: ReadEstimationExcelFromOneDrive,
  };

  try {
    const dataMap = await readerMap[fileType](client, file.id, file.name);
    const releaseKey = `${year}-${month}-${project}-${release}`;

    //  Manage release entry in global Map
    const releaseEntry = DlsResultsMap.get(releaseKey) || {};
    
    //  For Estimation files, combine multiple files by summing values
    if (fileType === "Estimation" && releaseEntry.Estimation) {
      const existingEstimation = releaseEntry.Estimation;
      const existingEffort = existingEstimation.get("estimatedEffort") || 0;
      const existingEngineering = existingEstimation.get("engineeringEfforts") || 0;
      const newEffort = dataMap.get("estimatedEffort") || 0;
      const newEngineering = dataMap.get("engineeringEfforts") || 0;
      
      dataMap.set("estimatedEffort", existingEffort + newEffort);
      dataMap.set("engineeringEfforts", existingEngineering + newEngineering);
      logger.info(`Combined Estimation: estimatedEffort=${existingEffort + newEffort}, engineeringEfforts=${existingEngineering + newEngineering}`);
    }
    
    releaseEntry[fileType] = dataMap;
    DlsResultsMap.set(releaseKey, releaseEntry);

    //  If all files exist, build KPI
    const { DLS, TestReport, Estimation } = releaseEntry;
    if (DLS && TestReport && Estimation) {
      logger.info(`Building KPI data for ${year}/${month}/${project}/${release}`);

      const kpiData = await BuildKpiDataForRelease(releaseEntry);
      if (!kpiData) return;

      // Set estimation to 0 for Live Dashboard project
      if (project.toLowerCase().includes("live dashboard")) {
        kpiData.manDays = 0;
        kpiData.engineeringEfforts = 0;
        logger.info(`Setting estimation to 0 for Live Dashboard project`);
      }

      const dbProject = await FindOrCreateProject(project);
      const monthNum = GetMonthNumber(month);

      const dbRelease = await ReleaseService.CreateRelease(
        dbProject.project_id,
        parseInt(year),
        monthNum,
        null,
        release
      );

      await KpiReportService.CreateKpiReport(dbRelease.release_id, kpiData);
      logger.info(`KPI Data Inserted for ${year}/${month}/${project}/${release}`);
    }
  } catch (err) {
    logger.error(`Error processing ${file.name}:`, { error: err.message, stack: err.stack });
  }
}



/**
 * Function to initialize DB for a specific month of a year
 * @param {*} baseDir Directory where the year folders are present
 * @param {*} year year for which data needs to be synced
 * @param {*} month month for which data needs to be synced
 */
async function InitializeDatabaseForMonth() {
  try {
    logger.info('Initializing OneDrive connection for current month');

    //  OneDrive authentication (reuse global credentials)
    const credential = new ClientSecretCredential(global.TenantId, global.ClientId, global.ClientSecret);
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
          return tokenResponse.token;
        },
      },
    });

    // Compute current year and month
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = now.toLocaleString("en-US", { month: "short" }); // e.g. "Nov"

    logger.info(`Syncing OneDrive data for: ${currentMonth} ${currentYear}`);
    const releaseIdsToDelete = [];
    await ReleaseService.GetAllReleases().then(releases => {
      releases.forEach(release => {
        if (release.year === currentYear && release.month === currentMonth) {
          releaseIdsToDelete.push(release.release_id);
        }
      });
    });
    // Pass scoped filters into TraverseOneDrive
    await TraverseOneDrive(client, {
      yearFilter: currentYear,
      monthFilter: currentMonth,
    });

    if(releaseIdsToDelete.length > 0){
      //  Delete previous entries for this month/year
      await ReleaseService.DeleteKpiRelease(releaseIdsToDelete);
      await KpiReportService.DeleteKpiReports(releaseIdsToDelete);
    }

    logger.info('OneDrive monthly sync complete');
  } catch (err) {
    logger.error('Error syncing current month from OneDrive:', { error: err.message, stack: err.stack });
  }
}

/**
 * Function to find existing project or create a new one
 * @param {*} projectName Name of the project
 */
async function FindOrCreateProject(projectName) {
  const projects = await ProjectService.GetAllProjects();
  let existing = projects.find((p) => p.project_name === projectName);
  if (existing) return existing;
  return await ProjectService.CreateProject(projectName);
}

/**
 * Function to build KPI data from the Excel files of a release
 * @param {*} releasePath path object containing paths to DLS and Test Report files
 */
async function BuildKpiDataForRelease(releaseEntry) {
  try {
    const dlsData = releaseEntry.DLS || new Map();
    const testReportData = releaseEntry.TestReport || new Map();
    const estimationData = releaseEntry.Estimation || new Map();

    return {
      iaChangeDeliverables: testReportData.get("uniqueWrikeIdCount") || 0,
      iaBugs: dlsData.get("RequirementBugs") || 0,
      loc: dlsData.get("linesOfCode") || 0,
      codingBugs: dlsData.get("CodingBugs") || 0,
      codeReviewBugs: dlsData.get("CodeReviewPoints") || 0,
      utDeliverables: dlsData.get("utCases") || 0,
      utBugs: dlsData.get("unitTestCasesBugs") || 0,
      itDeliverables: dlsData.get("integrationTestCases") || 0,
      itBugs: dlsData.get("integrationTestingPoints") || 0,
      srsDeliverables: testReportData.get("uniqueWrikeIdCount") || 0,
      srsBugs: dlsData.get("RequirementBugs") || 0,
      sddBugs: dlsData.get("DesignBugs") || 0,
      manDays: estimationData.get("estimatedEffort") || 0,
      engineeringEfforts: estimationData.get("engineeringEfforts") || 0,
      ursDeliverables: 0,
      ursBugs: 0,
      wrikeDeliverables: 0,
      wrikeBugs: 0,
      systemTestDeliverables: 0,
      ntkeBugs: 0,
      estimationCost: 0,
      manMonth: 0,
      criticalBugs: dlsData.get("criticalBugs") || 0,
      majorBugs: dlsData.get("majorBugs") || 0,
      minorBugs: dlsData.get("minorBugs") || 0,
      lowBugs: dlsData.get("lowBugs") || 0,
      systemTestRequirementBugs: dlsData.get("systemTestRequirementBugs") || 0,
      systemTestDesignBugs: dlsData.get("systemTestDesignBugs") || 0,
      systemTestCodingBugs: dlsData.get("systemTestCodingBugs") || 0,
      systemTestUTBugs: dlsData.get("systemTestUTBugs") || 0,
      systemTestCodeReviewBugs: dlsData.get("systemTestCodeReviewBugs") || 0,
      systemTestIntegrationBugs: dlsData.get("systemTestIntegrationBugs") || 0,
      integrationTestingBugs: dlsData.get("integrationTestingBugs") || 0,
      uatBugs: dlsData.get("uatBugs") || 0,
      goLiveBugs: dlsData.get("goLiveBugs") || 0,
      previousPhaseBugs: dlsData.get("previousPhaseBugs") || 0,
      currentPhaseBugs: dlsData.get("currentPhaseBugs") || 0,
      categoryData: dlsData.get("categoryData") || '{}',
      openPoints: dlsData.get("openPoints") || 0
    };
  } catch (err) {
    logger.error('Error building KPI data:', { error: err.message, stack: err.stack });
    throw new Error(`Error building KPI data for release: ${err.message}`);
  }
}

async function GetBugAnalysisData(filters) {
  try {
    const year = filters.year;
    const month = filters.month;

    // Fetch bug data from the database or any other source
    const bugData = await BugService.GetBugsByDate(year, month);
    return bugData;
  } catch (err) {
    logger.error('Error fetching bug analysis data:', { error: err.message, stack: err.stack });
    throw new Error(`Error fetching bug analysis data: ${err.message}`);
  }
}

module.exports = {
  InitializeDatabaseFromOneDrive,
  InitializeDatabaseForMonth,
  GetBugAnalysisData,
};
