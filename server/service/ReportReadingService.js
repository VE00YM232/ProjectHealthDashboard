/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: Report Reading Service
* Description
* -----------------------------------------------------------------------------------
* Provides service related to reading data from Excel files (DLS and Test Report)
* 
* -----------------------------------------------------------------------------------
* 
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/

const logger = require('../config/logger');

/**
 * Reads the DLS Excel file from OneDrive using a single range call
 */
async function ReadDlsExcelFromOneDrive(client, fileId, fileName) {
  const DlsDataMap = new Map();

  try {
    if (fileName.startsWith("~$") || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xlsm"))) {
      logger.warn(`Skipping invalid Excel file: ${fileName}`);
      return DlsDataMap;
    }

    //  Step 1: Get all sheets
    const sheetResponse = await client.api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets`).get();
    const sheetList = sheetResponse.value;
    const sheetName = sheetList[2]?.name || sheetList[0]?.name;
    logger.info(`Reading '${sheetName}' from ${fileName}`);

    //  Step 2: Fetch a range covering all target cells in one call
    const rangeResponse = await client
      .api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='A1:M30')`)
      .get();

    const values = rangeResponse.values || [];

    //  Step 3: Read Defect Sheet to get Previous Phase vs Current Phase bugs and Category data
    let previousPhaseBugs = 0;
    let currentPhaseBugs = 0;
    let categoryData = {};
    
    try {
      const defectSheet = sheetList.find(s => s.name?.toLowerCase().includes('defect'));
      
      if (defectSheet) {
        logger.info(`Reading Defect Sheet: '${defectSheet.name}'`);
        
        // Read the used range of the Defect Sheet to get all rows
        const defectRange = await client
          .api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets('${defectSheet.name}')/usedRange(valuesOnly=true)`)
          .get();
        
        const defectRows = defectRange?.values || [];
        
        // Find the header row (should contain "Phase" in column L)
        // Instead of looking for "Phase" header, search for the column that contains "Previous Phase" or "Current Phase" as VALUES
        let phaseColumnIndex = -1;
        let categoryColumnIndex = -1;
        let firstPhaseRowIndex = -1;
        
        logger.debug('Searching for column containing "Previous Phase" or "Current Phase" as values');
        
        // Search through all columns and rows to find where these values appear
        outerLoop:
        for (let colIndex = 0; colIndex < 20; colIndex++) { // Check first 20 columns
          for (let rowIndex = 0; rowIndex < Math.min(defectRows.length, 100); rowIndex++) {
            const row = defectRows[rowIndex];
            if (!row || !row[colIndex]) continue;
            
            const cellValue = String(row[colIndex]).toLowerCase().trim();
            
            // Check if this cell contains "previous phase" or "current phase"
            if (cellValue === 'previous phase' || cellValue === 'current phase') {
              phaseColumnIndex = colIndex;
              categoryColumnIndex = colIndex - 1; // Category column is to the left of Phase column
              firstPhaseRowIndex = rowIndex;
              const columnLetter = String.fromCharCode(65 + colIndex);
              const categoryColumnLetter = String.fromCharCode(65 + categoryColumnIndex);
              logger.debug(`Found Phase value column at index ${colIndex} (Column ${columnLetter})`);
              logger.debug(`Category column should be at index ${categoryColumnIndex} (Column ${categoryColumnLetter})`);
              logger.debug(`First phase value found at row ${rowIndex + 1}: "${row[colIndex]}"`);
              break outerLoop;
            }
          }
        }
        
        // If we found the Phase column, count bugs by phase and category
        if (phaseColumnIndex !== -1) {
          logger.debug(`Counting all phase bugs from column ${String.fromCharCode(65 + phaseColumnIndex)}`);
          logger.debug(`Extracting category data from column ${String.fromCharCode(65 + categoryColumnIndex)}`);
          let samplePhases = [];
          let emptyCount = 0;
          let totalRowsProcessed = 0;
          let otherValues = new Set();
          
          for (let i = 0; i < defectRows.length; i++) {
            const row = defectRows[i];
            if (!row || !row[phaseColumnIndex]) {
              emptyCount++;
              continue;
            }
            
            totalRowsProcessed++;
            const phaseCell = row[phaseColumnIndex];
            
            // Skip completely empty cells
            if (!phaseCell || phaseCell === null || phaseCell === '') {
              emptyCount++;
              continue;
            }
            
            const phaseValue = String(phaseCell).trim();
            const phaseLower = phaseValue.toLowerCase();
            
            // Collect first 10 phase values as samples for debugging
            if (samplePhases.length < 10 && phaseValue) {
              samplePhases.push(`"${phaseValue}"`);
            }
            
            // Count as one bug per row with exact matching
            if (phaseLower === 'previous phase') {
              previousPhaseBugs++;
              
              // Extract category data only for Previous Phase defects
              if (categoryColumnIndex >= 0 && row[categoryColumnIndex]) {
                let categoryValue = String(row[categoryColumnIndex]).trim();
                const categoryLower = categoryValue.toLowerCase().trim();
                
                // Skip empty values, header rows, and common non-data values
                if (categoryValue && 
                    categoryValue !== '' && 
                    categoryValue !== null && 
                    categoryLower !== 'category' &&
                    categoryLower !== 'categories') {
                  // Normalize category name to handle case-insensitive duplicates
                  // Convert to proper case (first letter uppercase, rest lowercase)
                  const normalizedCategory = categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1).toLowerCase();
                  
                  // Count each category occurrence
                  if (!categoryData[normalizedCategory]) {
                    categoryData[normalizedCategory] = 0;
                  }
                  categoryData[normalizedCategory]++;
                }
              }
            } else if (phaseLower === 'current phase') {
              currentPhaseBugs++;
              
              // Extract category data only for Current Phase defects
              if (categoryColumnIndex >= 0 && row[categoryColumnIndex]) {
                let categoryValue = String(row[categoryColumnIndex]).trim();
                const categoryLower = categoryValue.toLowerCase().trim();
                
                // Skip empty values, header rows, and common non-data values
                if (categoryValue && 
                    categoryValue !== '' && 
                    categoryValue !== null && 
                    categoryLower !== 'category' &&
                    categoryLower !== 'categories') {
                  // Normalize category name to handle case-insensitive duplicates
                  // Convert to proper case (first letter uppercase, rest lowercase)
                  const normalizedCategory = categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1).toLowerCase();
                  
                  // Count each category occurrence
                  if (!categoryData[normalizedCategory]) {
                    categoryData[normalizedCategory] = 0;
                  }
                  categoryData[normalizedCategory]++;
                }
              }
            } else {
              // Track other values for debugging
              otherValues.add(phaseLower);
            }
          }
          
          logger.debug(`Total rows processed: ${totalRowsProcessed}`);
          logger.debug(`Empty/null phase cells: ${emptyCount}`);
          if (samplePhases.length > 0) {
            logger.debug(`Sample phase values: ${samplePhases.join(', ')}`);
          }
          if (otherValues.size > 0) {
            logger.debug(`Other unique values found (first 5): ${Array.from(otherValues).slice(0, 5).join(', ')}`);
          }
          logger.info(`Previous Phase Bugs: ${previousPhaseBugs}, Current Phase Bugs: ${currentPhaseBugs}`);
          logger.info('Category data extracted:', categoryData);
        } else {
          logger.warn('Could not find column with "Previous Phase" or "Current Phase" values in Defect Sheet');
        }
      }
    } catch (defectErr) {
      logger.warn(`Could not read Defect Sheet: ${defectErr.message}`);
    }

    //  Step 3: Extract required cells (based on offsets)
    const get = (cellRef) => {
      const match = cellRef.match(/^([A-Z]+)(\d+)$/);
      const col = match[1].charCodeAt(0) - 65;
      const row = parseInt(match[2]) - 1;
      return values[row]?.[col] ?? null;
    };

    DlsDataMap.set("utCases", get("F6"));
    DlsDataMap.set("integrationTestCases", get("F7"));
    DlsDataMap.set("linesOfCode", get("I6"));
    DlsDataMap.set("unitTestCasesBugs", get("E11"));
    DlsDataMap.set("RequirementBugs", get("B11"));
    DlsDataMap.set("DesignBugs", get("C11"));
    DlsDataMap.set("CodingBugs", get("D11"));
    DlsDataMap.set("CodeReviewPoints", get("F11"));
    DlsDataMap.set("integrationTestingPoints", get("G11"));

    DlsDataMap.set("criticalBugs", get("J11"));
    DlsDataMap.set("majorBugs", get("K11"));
    DlsDataMap.set("minorBugs", get("L11"));
    DlsDataMap.set("lowBugs", get("M11"));

    DlsDataMap.set("systemTestRequirementBugs", get("B25"));
    DlsDataMap.set("systemTestDesignBugs", get("C25"));
    DlsDataMap.set("systemTestCodingBugs", get("D25"));
    DlsDataMap.set("systemTestUTBugs", get("E25"));
    DlsDataMap.set("systemTestCodeReviewBugs", get("F25"));
    DlsDataMap.set("systemTestIntegrationBugs", get("G25"));

    // Add Integration Testing, UAT, and Go Live bugs
    DlsDataMap.set("integrationTestingBugs", get("G11"));
    DlsDataMap.set("uatBugs", get("H11"));
    DlsDataMap.set("goLiveBugs", get("I11"));

    // Add Previous Phase vs Current Phase bugs from Defect Sheet
    DlsDataMap.set("previousPhaseBugs", previousPhaseBugs);
    DlsDataMap.set("currentPhaseBugs", currentPhaseBugs);
    
    // Add Category data as JSON string
    DlsDataMap.set("categoryData", JSON.stringify(categoryData));

    // Step 4: Read Open Points from 2nd sheet (column P starting from row 10)
    let openPointsCount = 0;
    try {
      const secondSheet = sheetList[1]; // 2nd sheet (index 1)
      if (secondSheet) {
        logger.info(`Reading Open Points from 2nd sheet: '${secondSheet.name}'`);
        
        // Read the used range of the 2nd sheet to get status column
        const secondSheetRange = await client
          .api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets('${secondSheet.name}')/usedRange(valuesOnly=true)`)
          .get();
        
        const secondSheetRows = secondSheetRange?.values || [];
        
        // Column P is index 15 (0-based), starting from row 10 (index 9)
        const statusColumnIndex = 15; // Column P
        const startRowIndex = 9; // Row 10 (0-based index)
        
        for (let i = startRowIndex; i < secondSheetRows.length; i++) {
          const row = secondSheetRows[i];
          if (!row || !row[statusColumnIndex]) continue;
          
          const statusValue = String(row[statusColumnIndex]).toLowerCase().trim();
          
          // Count rows where status is "open"
          if (statusValue === 'open') {
            openPointsCount++;
          }
        }
        
        logger.info(`Found ${openPointsCount} open points in 2nd sheet`);
      }
    } catch (openPointsErr) {
      logger.warn(`Could not read Open Points from 2nd sheet: ${openPointsErr.message}`);
    }
    
    DlsDataMap.set("openPoints", openPointsCount);

    return DlsDataMap;
  } catch (err) {
    logger.error(`Error reading ${fileName}:`, { error: err.message, stack: err.stack });
    return DlsDataMap;
  }
}

/**
 * Reads the Test Report Excel file using range-based fetch
 */
async function ReadTestReportExcelFromOneDrive(client, fileId, fileName) {
  const testReportExcelDataMap = new Map();

  try {
    if (fileName.startsWith("~$") || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xlsm"))) {
      logger.warn(`Skipping invalid Excel file: ${fileName}`);
      return testReportExcelDataMap;
    }

    const sheetResponse = await client
      .api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets`)
      .get();

    const sheetList = sheetResponse.value;
    const analysisSheetName = sheetList[0]?.name;
    const testCasesSheetName = sheetList[1]?.name;

    if (!analysisSheetName || !testCasesSheetName) {
      throw new Error("Expected sheets not found.");
    }

    logger.info(`Reading '${analysisSheetName}' and '${testCasesSheetName}' from ${fileName}`);

    // Fetch full analysis range (e.g., first 20 rows/columns)
    const analysisRange = await client
      .api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets('${analysisSheetName}')/range(address='A1:T15')`)
      .get();

    const analysisValues = analysisRange.values || [];
    const get = (ref) => {
      const m = ref.match(/^([A-Z]+)(\d+)$/);
      const col = m[1].charCodeAt(0) - 65;
      const row = parseInt(m[2]) - 1;
      return analysisValues[row]?.[col] ?? null;
    };

    const testRounds = get("R6");

    // Fetch test case table once
    const testCaseRange = await client
      .api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets('${testCasesSheetName}')/usedRange(valuesOnly=true)`)
      .get();

    const rows = testCaseRange?.values || [];
    const headers = rows[0] || [];
    const wrikeIndex = headers.findIndex((h) => h?.toLowerCase() === "wrike id");

    const wrikeIds = wrikeIndex !== -1
      ? rows.slice(1).map(r => r[wrikeIndex]).filter(Boolean)
      : [];

    const uniqueIds = [...new Set(wrikeIds)];

    testReportExcelDataMap.set("testRounds", testRounds);
    testReportExcelDataMap.set("uniqueWrikeIds", uniqueIds);
    testReportExcelDataMap.set("uniqueWrikeIdCount", uniqueIds.length);

    logger.info(`Extracted ${uniqueIds.length} Wrike IDs`);
    return testReportExcelDataMap;
  } catch (err) {
    logger.error(`Error reading ${fileName}:`, { error: err.message, stack: err.stack });
    return testReportExcelDataMap;
  }
}

/**
 * Reads Estimation Excel file using single range call
 */
async function ReadEstimationExcelFromOneDrive(client, fileId, fileName) {
  const EstimationDataMap = new Map();

  try {
    if (fileName.startsWith("~$") || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xlsm"))) {
      logger.warn(`Skipping invalid Excel file: ${fileName}`);
      return EstimationDataMap;
    }

    const sheetResponse = await client.api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets`).get();
    const sheetName = sheetResponse.value[0]?.name;

    logger.info(`Reading '${sheetName}' from ${fileName}`);

    // Read a block instead of multiple cells
    const rangeResponse = await client
      .api(`/users/${global.OneDriveUserId}/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='A1:H20')`)
      .get();

    const values = rangeResponse.values || [];
    const get = (ref) => {
      const m = ref.match(/^([A-Z]+)(\d+)$/);
      const col = m[1].charCodeAt(0) - 65;
      const row = parseInt(m[2]) - 1;
      return values[row]?.[col] ?? null;
    };

    const estimatedEffort = get("H14");
    const engineeringEfforts = get("H12");

    EstimationDataMap.set("estimatedEffort", estimatedEffort);
    EstimationDataMap.set("engineeringEfforts", engineeringEfforts);

    return EstimationDataMap;
  } catch (err) {
    logger.error(`Error reading ${fileName}:`, { error: err.message, stack: err.stack });
    return EstimationDataMap;
  }
}


module.exports = {
  ReadDlsExcelFromOneDrive,
  ReadTestReportExcelFromOneDrive,
  ReadEstimationExcelFromOneDrive
}
