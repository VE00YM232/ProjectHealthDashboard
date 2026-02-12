/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: Contexts
* Description
* -----------------------------------------------------------------------------------
* Contains global context for component
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
 
const GlobalContext = createContext();
 
export const GlobalProvider = ({ children }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [averageData, setAverageData] = useState({});
 
  const calculateAverages = useCallback((kpiData) => {
    if (!kpiData || typeof kpiData !== "object") return {};
 
    const averages = {};
    const counts = {};
 
    // Traverse through nested structure: year → month → project → release
    for (const year of Object.values(kpiData)) {
      for (const month of Object.values(year)) {
        for (const project of Object.values(month)) {
          for (const release of Object.values(project)) {
            // release now has { rows: [...], categoryData: {...} } structure
            const rows = release.rows || release; // Support both formats
            if (!Array.isArray(rows)) continue;
            
            for (const item of rows) {
              const row = item.row;
              const deliverables = parseFloat(item.deliverables) || 0;
              const bugs = parseFloat(item.bugs) || 0;
 
              if (!averages[row]) {
                averages[row] = { totalDeliverables: 0, totalBugs: 0 };
                counts[row] = 0;
              }
 
              averages[row].totalDeliverables += deliverables;
              averages[row].totalBugs += bugs;
              counts[row]++;
            }
          }
        }
      }
    }
 
    // Convert totals into averages
    const result = {};
    for (const row in averages) {
      result[row] = {
        avgDeliverables: (
          averages[row].totalDeliverables / counts[row]
        ).toFixed(2),
        avgBugs: (averages[row].totalBugs / counts[row]).toFixed(2)
      };
    }
 
    return result;
  }, []);
 
 
  // move fetchKpiData into a function we can reuse
  const fetchKpiData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/getAllKPIData");
      if (!response.ok) throw new Error("Failed to fetch KPI data");
      const kpiData = await response.json();
      setData(kpiData);
      // Calculate averages
      const avgData = calculateAverages(kpiData);
      setAverageData(avgData);
    } catch (error) {
      console.error("Error fetching KPI data:", error);
    } finally {
      setLoading(false);
    }
  }, [calculateAverages]);
 
  // run once on mount
  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData]);
 
  return (
    <GlobalContext.Provider value={{ data, loading, averageData, reloadData: fetchKpiData }}>
      {children}
    </GlobalContext.Provider>
  );
};
 
export const useGlobalData = () => useContext(GlobalContext);
