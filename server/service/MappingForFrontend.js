/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 24, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: Mapping For Frontend
* Description
* -----------------------------------------------------------------------------------
* Maps the database fields to frontend-friendly field names for Projects, Releases, and KPI Reports.
* 
* -----------------------------------------------------------------------------------
* 
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 24, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/

const { ProjectService, ReleaseService, KpiReportService } = require("../database/DatabaseService");
const logger = require('../config/logger');

// Map DB month numbers → month names
const monthNames = [
  null, "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Convert a single KPI row into {row, deliverables, bugs}
function MapKpiRow(kpi) {
  const rows = [
    { row: "SRS", deliverables: kpi.srs_deliverables, bugs: kpi.srs_bugs },
    { row: "SAD", deliverables: 0, bugs: 0}, 
    { row: "SDD", deliverables: kpi.srs_deliverables, bugs: kpi.sdd_bugs },
    { row: "CD (Kloc)", deliverables: kpi.loc, bugs: kpi.code_review_bugs },
    { row: "MT/UT(No of Unit Test cases)", deliverables: kpi.ut_deliverables, bugs: kpi.ut_bugs },
    { row: "IT(No of Test cases)", deliverables: kpi.it_deliverables, bugs: kpi.it_bugs},
    { row: "ST", deliverables: kpi.system_test_deliverables, bugs: kpi.ntke_bugs },
    { row: "Man Days", deliverables: kpi.man_days},
    { row: "Engineering Efforts", deliverables: kpi.engineering_efforts},
    { row: "Critical Bugs", bugs: kpi.critical_bugs},
    { row: "Major Bugs", bugs: kpi.major_bugs},
    { row: "Minor Bugs", bugs: kpi.minor_bugs},
    { row: "Low Bugs", bugs: kpi.low_bugs},
    { row: "Analysis Requirement Bugs", bugs: kpi.srs_bugs },
    { row: "Analysis Design Bugs", bugs: kpi.sdd_bugs },
    { row: "Analysis Coding Bugs", bugs: kpi.coding_bugs },
    { row: "Analysis UT Bugs", bugs: kpi.ut_bugs },
    { row: "Analysis Code Review Bugs", bugs: kpi.code_review_bugs },
    { row: "Analysis Integration Bugs", bugs: kpi.it_bugs },
    { row: "System Test Requirement Bugs", bugs: kpi.system_test_requirement_bugs },
    { row: "System Test Design Bugs", bugs: kpi.system_test_design_bugs },
    { row: "System Test Coding Bugs", bugs: kpi.system_test_coding_bugs },
    { row: "System Test UT Bugs", bugs: kpi.system_test_ut_bugs },
    { row: "System Test Code Review Bugs", bugs: kpi.system_test_code_review_bugs },
    { row: "System Test Integration Bugs", bugs: kpi.system_test_integration_bugs },
    { row: "Integration Testing Bugs", bugs: kpi.integration_testing_bugs },
    { row: "UAT Bugs", bugs: kpi.uat_bugs },
    { row: "Go Live Bugs", bugs: kpi.go_live_bugs },
    { row: "Previous Phase Bugs", bugs: kpi.previous_phase_bugs },
    { row: "Current Phase Bugs", bugs: kpi.current_phase_bugs },
    { row: "Open Points", deliverables: kpi.open_points }
  ];
  
  // Parse category data if available
  let categoryData = {};
  try {
    if (kpi.category_data) {
      categoryData = typeof kpi.category_data === 'string' 
        ? JSON.parse(kpi.category_data) 
        : kpi.category_data;
    }
  } catch (err) {
    logger.error('Error parsing category data:', { error: err.message, stack: err.stack });
  }
  
  // Return object with both rows and categoryData (arrays lose properties in JSON serialization)
  return {
    rows: rows,
    categoryData: categoryData
  };
}

// Month order for sorting (latest month first)
const monthOrder = {
  "December": 1, "November": 2, "October": 3, "September": 4,
  "August": 5, "July": 6, "June": 7, "May": 8,
  "April": 9, "March": 10, "February": 11, "January": 12
};

/**
 * Function to get all KPI data structured for frontend
 * Returns data sorted with latest year and month first
 */
async function GetKpiDataForAllReleases() {
  const releases = await ReleaseService.GetAllReleases();
  const reports = await KpiReportService.GetAllKpiReports();
  const projects = await ProjectService.GetAllProjects();

  const projectMap = {};
  for (const p of projects) {
    projectMap[p.project_id] = p.project_name;
  }

  const hierarchy = {};

  for (const release of releases) {
    const year = release.year.toString();
    const month = monthNames[release.month];
    const project = projectMap[release.project_id];
    const releaseName = release.release_name;

    // Ensure nested structure exists
    if (!hierarchy[year]) hierarchy[year] = {};
    if (!hierarchy[year][month]) hierarchy[year][month] = {};
    if (!hierarchy[year][month][project]) hierarchy[year][month][project] = {};

    // Find KPI report for this release
    const kpi = reports.find(r => r.release_id === release.release_id);
    if (kpi) {
      hierarchy[year][month][project][releaseName] = MapKpiRow(kpi);
    }
  }

  // Sort the hierarchy: latest year first, then latest month first
  const sortedHierarchy = {};
  
  // Sort years in descending order (latest first)
  const sortedYears = Object.keys(hierarchy).sort((a, b) => parseInt(b) - parseInt(a));
  
  for (const year of sortedYears) {
    sortedHierarchy[year] = {};
    
    // Sort months in descending order (latest first)
    const sortedMonths = Object.keys(hierarchy[year]).sort((a, b) => {
      return (monthOrder[a] || 99) - (monthOrder[b] || 99);
    });
    
    for (const month of sortedMonths) {
      // Sort projects alphabetically
      sortedHierarchy[year][month] = {};
      const sortedProjects = Object.keys(hierarchy[year][month]).sort();
      
      for (const project of sortedProjects) {
        sortedHierarchy[year][month][project] = hierarchy[year][month][project];
      }
    }
  }

  return sortedHierarchy;
}

/**
 * Function to check user login credentials
 * @param {*} username 
 * @param {*} password 
 * @returns 
 */
async function CheckLogin(username, password) {
  try{
    const result = await ProjectService.CheckLoginCredentials(username, password);
    if (result) {
      return { success: true };
    } else {
      return { success: false, message: "Invalid username or password" };
    }
  }
  catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  GetKpiDataForAllReleases,
  CheckLogin
};