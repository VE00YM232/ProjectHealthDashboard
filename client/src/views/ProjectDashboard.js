/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Akanshu Raj
* @date    Jan 12, 2026
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: View ProjectDashboard
* Description
* -----------------------------------------------------------------------------------
* Contains components for project-level dashboard screen (all releases combined)
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Akanshu Raj          Jan 12, 2026        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React, { useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS } from 'chart.js';
import { useGlobalData } from "contexts/GlobalContext";
import { ThemeContext, themes } from "contexts/ThemeContext";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Table,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";

// Register the datalabels plugin
ChartJS.register(ChartDataLabels);

function ProjectDashboard() {
  const { year, month, project } = useParams();
  const { data, averageData } = useGlobalData();
  const { theme, changeTheme } = useContext(ThemeContext);
  const [showAverages, setShowAverages] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "mandays", "cost", "bugs", "defectdensity", or "kloc"

  const toggleModal = () => setModalOpen(!modalOpen);

  const openManDaysModal = () => {
    setModalType("mandays");
    setModalOpen(true);
  };

  const openCostModal = () => {
    setModalType("cost");
    setModalOpen(true);
  };

  const openBugsModal = () => {
    setModalType("bugs");
    setModalOpen(true);
  };

  const openDefectDensityModal = () => {
    setModalType("defectdensity");
    setModalOpen(true);
  };

  const openKlocModal = () => {
    setModalType("kloc");
    setModalOpen(true);
  };

  const openReleasesModal = () => {
    setModalType("releases");
    setModalOpen(true);
  };

  const openDreModal = () => {
    setModalType("dre");
    setModalOpen(true);
  };

  const openOpenPointsModal = () => {
    setModalType("openpoints");
    setModalOpen(true);
  };

  if (!year || !month || !project) {
    return (
      <div className="content">
        <h2>Project Dashboard</h2>
        <p>Please select a project from the sidebar.</p>
      </div>
    );
  }

  // Collect all releases for this project
  const projectData = data?.[year]?.[month]?.[project];

  if (!projectData) {
    return (
      <div className="content">
        <h2>{project} - {month} {year}</h2>
        <p>No data available for this project in {month} {year}.</p>
      </div>
    );
  }

  // Combine all rows from all releases
  let allRows = [];
  let releasesList = [];
  let numberOfReleases = 0;
  let releaseWiseData = []; // For modal display

  if (Array.isArray(projectData)) {
    // Direct array (no releases) - old format
    allRows = projectData;
    numberOfReleases = 0;
  } else {
    // Object with releases
    releasesList = Object.keys(projectData);
    numberOfReleases = releasesList.length;
    
    // Extract rows from each release (handling both old array format and new {rows, categoryData} format)
    allRows = releasesList.flatMap(release => {
      const releaseData = projectData[release];
      // Check if it's the new format {rows, categoryData} or old format (array)
      return releaseData && releaseData.rows ? releaseData.rows : (releaseData || []);
    });

    // Calculate release-wise man days, cost, bugs, and defect density
    const costPerManDay = 250;
    releaseWiseData = releasesList.map(release => {
      const releaseData = projectData[release];
      // Handle both new {rows, categoryData} format and old array format
      const releaseRows = releaseData && releaseData.rows ? releaseData.rows : (releaseData || []);
      
      const manDays = releaseRows.find(r => r.row === "Man Days")?.deliverables || 0;
      const cost = manDays * costPerManDay;

      // Calculate bugs excluding categorization rows (same logic as totalBugs)
      const releaseBugs = releaseRows
        .filter(r =>
          r.row !== "Man Days" &&
          r.row !== "Engineering Efforts" &&
          r.row !== "Critical Bugs" &&
          r.row !== "Major Bugs" &&
          r.row !== "Minor Bugs" &&
          r.row !== "Low Bugs" &&
          r.row !== "Analysis Requirement Bugs" &&
          r.row !== "Analysis Design Bugs" &&
          r.row !== "Analysis Coding Bugs" &&
          r.row !== "Analysis UT Bugs" &&
          r.row !== "Analysis Code Review Bugs" &&
          r.row !== "Analysis Integration Bugs" &&
          r.row !== "System Test Requirement Bugs" &&
          r.row !== "System Test Design Bugs" &&
          r.row !== "System Test Coding Bugs" &&
          r.row !== "System Test UT Bugs" &&
          r.row !== "System Test Code Review Bugs" &&
          r.row !== "System Test Integration Bugs" &&
          r.row !== "Integration Testing Bugs" &&
          r.row !== "UAT Bugs" &&
          r.row !== "Go Live Bugs" &&
          r.row !== "Previous Phase Bugs" &&
          r.row !== "Current Phase Bugs"
        )
        .reduce((sum, r) => sum + (Number(r.bugs) || 0), 0);
      
      const releaseDeliverables = releaseRows.reduce((sum, r) => sum + (Number(r.deliverables) || 0), 0);
      
      // Extract KLoc data and IT bugs for bug density calculation
      const releaseKloc = Number((releaseRows.find(r => r.row === "CD (Kloc)")?.deliverables || 0).toFixed(3));
      const releaseItBugs = releaseRows.find(r => r.row === "IT(No of Test cases)")?.bugs || 0;
      const releaseDefectDensity = releaseKloc > 0
        ? (releaseItBugs / releaseKloc).toFixed(2)
        : "0.00";

      // Extract Open Points from release data
      const releaseOpenPoints = releaseRows.find(r => r.row === "Open Points")?.deliverables || 0;

      // Calculate DRE for this release
      const releaseIntegrationTestingBugs = releaseRows.find(r => r.row === "Integration Testing Bugs")?.bugs || 0;
      const releaseUatBugs = releaseRows.find(r => r.row === "UAT Bugs")?.bugs || 0;
      const releaseGoLiveBugs = releaseRows.find(r => r.row === "Go Live Bugs")?.bugs || 0;
      const releaseTotalTestingPhaseBugs = releaseIntegrationTestingBugs + releaseUatBugs + releaseGoLiveBugs;
      const releasePostIntegrationBugs = releaseUatBugs + releaseGoLiveBugs;
      
      let releaseDre;
      if (releasePostIntegrationBugs === 0) {
        releaseDre = "100%";
      } else if (releaseTotalTestingPhaseBugs > 0) {
        releaseDre = ((releasePostIntegrationBugs / releaseTotalTestingPhaseBugs) * 100).toFixed(2) + "%";
      } else {
        releaseDre = "-";
      }

      // Extract release date from original release name (last 8 digits)
      const dateMatch = release.match(/_?(\d{8})$/);
      const releaseDate = dateMatch ? dateMatch[1] : "N/A";
      // Format date as YYYY-MM-DD
      const formattedDate = releaseDate !== "N/A"
        ? `${releaseDate.substring(0, 4)}-${releaseDate.substring(4, 6)}-${releaseDate.substring(6, 8)}`
        : "N/A";

      // Format release name: remove "RELEASE_" prefix and date suffix
      let formattedRelease = release;
      if (formattedRelease.startsWith('RELEASE_')) {
        formattedRelease = formattedRelease.replace('RELEASE_', '');
      }
      // Remove date suffix (underscore followed by 8 digits)
      formattedRelease = formattedRelease.replace(/_\d{8}$/, '');

      return {
        release: formattedRelease,
        originalRelease: release,
        releaseDate: formattedDate,
        manDays,
        cost,
        bugs: releaseBugs,
        defectDensity: releaseDefectDensity,
        kloc: releaseKloc,
        dre: releaseDre,
        openPoints: releaseOpenPoints
      };
    });
  }

  if (!allRows.length) {
    return (
      <div className="content">
        <h2>{project} - {month} {year}</h2>
        <p>No KPI data available.</p>
      </div>
    );
  }

  // Aggregate data by row field
  const aggregatedByRow = {};

  allRows.forEach(row => {
    const rowName = row.row;
    if (!rowName) return;

    if (!aggregatedByRow[rowName]) {
      aggregatedByRow[rowName] = {
        row: rowName,
        deliverables: 0,
        bugs: 0
      };
    }

    // For Previous Phase and Current Phase bugs, use max instead of sum (they are cumulative counts)
    if (rowName === "Previous Phase Bugs" || rowName === "Current Phase Bugs") {
      aggregatedByRow[rowName].bugs = Math.max(aggregatedByRow[rowName].bugs, Number(row.bugs) || 0);
    } else {
      aggregatedByRow[rowName].deliverables += Number(row.deliverables) || 0;
      aggregatedByRow[rowName].bugs += Number(row.bugs) || 0;
    }
  });

  // Convert to array - don't filter, keep all rows
  const aggregatedRows = Object.values(aggregatedByRow);

  // Extract bug categorization from aggregated rows
  const totalCriticalBugs = aggregatedRows.find(r => r.row === "Critical Bugs")?.bugs || 0;
  const totalMajorBugs = aggregatedRows.find(r => r.row === "Major Bugs")?.bugs || 0;
  const totalMinorBugs = aggregatedRows.find(r => r.row === "Minor Bugs")?.bugs || 0;
  const totalLowBugs = aggregatedRows.find(r => r.row === "Low Bugs")?.bugs || 0;

  // Bug Distribution by Type - Use Analysis sheet B11-G11 data
  const totalRequirementBugs = aggregatedRows.find(r => r.row === "Analysis Requirement Bugs")?.bugs || 0;
  const totalDesignBugs = aggregatedRows.find(r => r.row === "Analysis Design Bugs")?.bugs || 0;
  const totalCodingBugs = aggregatedRows.find(r => r.row === "Analysis Coding Bugs")?.bugs || 0;
  const totalUTBugs = aggregatedRows.find(r => r.row === "Analysis UT Bugs")?.bugs || 0;
  const totalCodeReviewBugs = aggregatedRows.find(r => r.row === "Analysis Code Review Bugs")?.bugs || 0;
  const totalIntegrationBugs = aggregatedRows.find(r => r.row === "Analysis Integration Bugs")?.bugs || 0;

  // Extract bug categorization by testing phase from actual data
  const totalUnitTestBugs = aggregatedRows.find(r => r.row === "MT/UT(No of Unit Test cases)")?.bugs || 0;
  const totalIntegrationTestBugs = aggregatedRows.find(r => r.row === "IT(No of Test cases)")?.bugs || 0;
  const totalCodeReviewPhaseBugs = aggregatedRows.find(r => r.row === "CD (Kloc)")?.bugs || 0;

  // Get Previous Phase vs Current Phase Bugs from DLS Defect Sheet
  const previousPhaseBugsTotal = aggregatedRows.find(r => r.row === "Previous Phase Bugs")?.bugs || 0;
  const currentPhaseBugsTotal = aggregatedRows.find(r => r.row === "Current Phase Bugs")?.bugs || 0;

  // Get Integration Testing, UAT, and Go Live Bugs for Testing Phase Comparison
  const integrationTestingBugsTotal = aggregatedRows.find(r => r.row === "Integration Testing Bugs")?.bugs || 0;
  const uatBugsTotal = aggregatedRows.find(r => r.row === "UAT Bugs")?.bugs || 0;
  const goLiveBugsTotal = aggregatedRows.find(r => r.row === "Go Live Bugs")?.bugs || 0;

  // Calculate totals - sum from releaseWiseData to avoid floating point issues
  const totalKloc = Number(releaseWiseData.reduce((sum, r) => sum + (Number(r.kloc) || 0), 0).toFixed(3));

  // Calculate total open points from all releases
  const totalOpenPoints = releaseWiseData.reduce((sum, r) => sum + (Number(r.openPoints) || 0), 0);

  const totalDeliverables = aggregatedRows
    .filter(r => r.row !== "Man Days" && r.row !== "Engineering Efforts")
    .reduce((sum, r) => sum + r.deliverables, 0);

  const totalBugs = aggregatedRows
    .filter(r =>
      r.row !== "Man Days" &&
      r.row !== "Engineering Efforts" &&
      r.row !== "Critical Bugs" &&
      r.row !== "Major Bugs" &&
      r.row !== "Minor Bugs" &&
      r.row !== "Low Bugs" &&
      r.row !== "Analysis Requirement Bugs" &&
      r.row !== "Analysis Design Bugs" &&
      r.row !== "Analysis Coding Bugs" &&
      r.row !== "Analysis UT Bugs" &&
      r.row !== "Analysis Code Review Bugs" &&
      r.row !== "Analysis Integration Bugs" &&
      r.row !== "System Test Requirement Bugs" &&
      r.row !== "System Test Design Bugs" &&
      r.row !== "System Test Coding Bugs" &&
      r.row !== "System Test UT Bugs" &&
      r.row !== "System Test Code Review Bugs" &&
      r.row !== "System Test Integration Bugs" &&
      r.row !== "Integration Testing Bugs" &&
      r.row !== "UAT Bugs" &&
      r.row !== "Go Live Bugs" &&
      r.row !== "Previous Phase Bugs" &&
      r.row !== "Current Phase Bugs"
    )
    .reduce((sum, r) => sum + r.bugs, 0);

  const totalManDays = aggregatedRows.find(r => r.row === "Man Days")?.deliverables || 0;

  // Calculate total cost (assuming $250 per man-day as standard rate)
  const costPerManDay = 250; // Can be adjusted based on actual rate
  const totalCost = totalManDays * costPerManDay;
  const formattedCost = totalCost > 0 ? `$${totalCost.toLocaleString()}` : "-";

  // Calculate KPIs
  // Bug Density using IT bugs per KLOC
  const defectDensity = totalKloc > 0
    ? (totalIntegrationTestBugs / totalKloc).toFixed(2)
    : "-";

  // Calculate DRE (Defect Removal Efficiency)
  // DRE = (UAT + Go Live bugs) / (UAT + Go Live + Integration Testing bugs) * 100
  const totalTestingPhaseBugs = integrationTestingBugsTotal + uatBugsTotal + goLiveBugsTotal;
  const postIntegrationBugs = uatBugsTotal + goLiveBugsTotal;
  
  let dre;
  if (postIntegrationBugs === 0) {
    dre = "100%";
  } else if (totalTestingPhaseBugs > 0) {
    dre = ((postIntegrationBugs / totalTestingPhaseBugs) * 100).toFixed(2) + "%";
  } else {
    dre = "-";
  }

  // Extract and aggregate category data from all releases
  let categoryData = {};
  
  if (Array.isArray(projectData)) {
    // Direct array format - check if categoryData is attached (old format, unlikely to have category data)
    if (projectData.categoryData) {
      categoryData = projectData.categoryData;
    }
  } else {
    // Object with releases - aggregate from all releases
    releasesList.forEach(release => {
      const releaseData = projectData[release];
      
      // Check if it's the new format {rows, categoryData}
      if (releaseData && releaseData.categoryData) {
        Object.keys(releaseData.categoryData).forEach(category => {
          if (!categoryData[category]) {
            categoryData[category] = 0;
          }
          categoryData[category] += releaseData.categoryData[category];
        });
      }
    });
  }

  // Prepare category bar chart data
  const categoryLabels = Object.keys(categoryData);
  const categoryValues = Object.values(categoryData);
  const categoryTotal = categoryValues.reduce((sum, val) => sum + val, 0);

  const categoryBarData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Bugs by Category',
        data: categoryValues,
        backgroundColor: [
          '#1f8ef1',
          '#00d6b4',
          '#fd5d93',
          '#ffc107',
          '#e14eca',
          '#9c27b0',
          '#00bcd4',
          '#ff9800'
        ],
        borderWidth: 2,
        borderColor: theme === themes.light ? '#ffffff' : '#27293d'
      }
    ]
  };

  const categoryBarOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        color: theme === themes.light ? '#1e1e2e' : '#ffffff',
        font: {
          size: 12,
          weight: 'bold'
        },
        formatter: (value) => value
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme === themes.light ? '#1e1e2e' : '#ffffff',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grace: '10%',
        grid: {
          color: theme === themes.light ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: theme === themes.light ? '#1e1e2e' : '#ffffff',
          font: {
            size: 11
          }
        }
      }
    }
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'end',
        color: '#fff',
        font: {
          size: 10,
          weight: 'bold'
        },
        formatter: function (value) {
          return value > 0 ? value : '';
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            size: 11
          },
          color: theme === 'white-content' ? '#344675' : '#fff'
        },
        grid: {
          color: theme === 'white-content' ? 'rgba(34, 42, 66, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        }
      },
      y: {
        ticks: {
          font: {
            size: 10,
            weight: '500'
          },
          color: theme === 'white-content' ? '#344675' : '#fff',
          padding: 5
        },
        grid: {
          color: theme === 'white-content' ? 'rgba(34, 42, 66, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        }
      },
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 50,
      },
    },
    categoryPercentage: 0.9,
    barPercentage: 0.95,
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 2,
        bottom: 2,
        left: 2,
        right: 2
      }
    },
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 13,
            family: "'Poppins', sans-serif"
          },
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: function (chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a, b) => a + b, 0);
              return data.labels.map((label, i) => {
                const value = dataset.data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 14,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 15,
        boxHeight: 15,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          size: 14,
          weight: 'bold'
        },
        formatter: function (value) {
          return value > 0 ? value : '';
        },
        textAlign: 'center'
      },
    },
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  // Pie Chart 1: Bug Severity
  const severityPieData = {
    labels: ["Critical", "Major", "Minor", "Low"],
    datasets: [
      {
        data: [totalCriticalBugs, totalMajorBugs, totalMinorBugs, totalLowBugs],
        backgroundColor: [
          "rgba(220, 53, 69, 0.9)",   // Critical - Red
          "rgba(255, 159, 64, 0.9)",  // Major - Orange
          "rgba(255, 206, 86, 0.9)",  // Minor - Yellow
          "rgba(75, 192, 192, 0.9)",  // Low - Teal
        ],
        borderWidth: 0,
        hoverOffset: 15,
        hoverBorderWidth: 0,
      },
    ],
  };

  // Pie Chart 2: Bug Types
  const bugTypePieData = {
    labels: ["Requirement", "Design", "Coding", "UT", "Code Review", "Integration"],
    datasets: [
      {
        data: [
          totalRequirementBugs,
          totalDesignBugs,
          totalCodingBugs,
          totalUTBugs,
          totalCodeReviewBugs,
          totalIntegrationBugs,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.9)",  // Requirement - Pink
          "rgba(54, 162, 235, 0.9)",  // Design - Blue
          "rgba(255, 206, 86, 0.9)",  // Coding - Yellow
          "rgba(75, 192, 192, 0.9)",  // UT - Teal
          "rgba(153, 102, 255, 0.9)", // Code Review - Purple
          "rgba(255, 159, 64, 0.9)",  // Integration - Orange
        ],
        borderWidth: 0,
        hoverOffset: 15,
        hoverBorderWidth: 0,
      },
    ],
  };

  // Doughnut Chart: Bug Testing Phase
  const testingPhaseDoughnutData = {
    labels: ["Unit Testing", "Integration Testing", "Code Review"],
    datasets: [
      {
        data: [
          totalUnitTestBugs,
          totalIntegrationTestBugs,
          totalCodeReviewPhaseBugs,
        ],
        backgroundColor: [
          "rgba(54, 162, 235, 0.9)",  // Unit Testing - Blue
          "rgba(75, 192, 192, 0.9)",  // Integration Testing - Teal
          "rgba(153, 102, 255, 0.9)", // Code Review - Purple
        ],
        borderWidth: 0,
        hoverOffset: 15,
        hoverBorderWidth: 0,
      },
    ],
  };

  // Prepare chart data from aggregated rows (exclude Man Days, Engineering Efforts, and bug categorization rows)
  const chartRows = aggregatedRows.filter(r =>
    r.row !== "Man Days" &&
    r.row !== "Engineering Efforts" &&
    r.row !== "Critical Bugs" &&
    r.row !== "Major Bugs" &&
    r.row !== "Minor Bugs" &&
    r.row !== "Low Bugs" &&
    r.row !== "Analysis Requirement Bugs" &&
    r.row !== "Analysis Design Bugs" &&
    r.row !== "Analysis Coding Bugs" &&
    r.row !== "Analysis UT Bugs" &&
    r.row !== "Analysis Code Review Bugs" &&
    r.row !== "Analysis Integration Bugs" &&
    r.row !== "System Test Requirement Bugs" &&
    r.row !== "System Test Design Bugs" &&
    r.row !== "System Test Coding Bugs" &&
    r.row !== "System Test UT Bugs" &&
    r.row !== "System Test Code Review Bugs" &&
    r.row !== "System Test Integration Bugs" &&
    r.row !== "Integration Testing Bugs" &&
    r.row !== "UAT Bugs" &&
    r.row !== "Go Live Bugs" &&
    r.row !== "Previous Phase Bugs" &&
    r.row !== "Current Phase Bugs"
  );

  const chartData = {
    labels: chartRows.map(r => r.row),
    datasets: [
      {
        label: "Deliverables",
        data: chartRows.map(r => r.deliverables),
        backgroundColor: "rgba(29, 140, 248, 0.85)",
        borderColor: "rgba(29, 140, 248, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Bugs",
        data: chartRows.map(r => r.bugs),
        backgroundColor: "rgba(255, 99, 132, 0.85)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Previous vs Current Phase Bugs Chart Data
  const phaseComparisonData = {
    labels: ["Previous Phase", "Current Phase"],
    datasets: [
      {
        label: "Bugs Count",
        data: [previousPhaseBugsTotal, currentPhaseBugsTotal],
        backgroundColor: [
          "rgba(75, 192, 192, 0.85)",
          "rgba(255, 159, 64, 0.85)"
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 159, 64, 1)"
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Testing Phase Bugs Comparison Chart Data (Integration Testing, UAT, Production)
  const testingPhaseComparisonData = {
    labels: ["Integration Testing", "UAT", "Production"],
    datasets: [
      {
        label: "Bugs Count",
        data: [integrationTestingBugsTotal, uatBugsTotal, goLiveBugsTotal],
        backgroundColor: [
          "rgba(153, 102, 255, 0.85)",
          "rgba(255, 205, 86, 0.85)",
          "rgba(255, 99, 132, 0.85)"
        ],
        borderColor: [
          "rgba(153, 102, 255, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(255, 99, 132, 1)"
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Chart options for vertical bar chart (phase comparison)
  const phaseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'end',
        color: '#fff',
        font: {
          size: 14,
          weight: 'bold'
        },
        formatter: function (value) {
          return value > 0 ? value : '';
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: {
          precision: 0,
          font: {
            size: 11
          },
          color: theme === 'white-content' ? '#344675' : '#fff'
        },
        grid: {
          color: theme === 'white-content' ? 'rgba(34, 42, 66, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        }
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: '500'
          },
          color: theme === 'white-content' ? '#344675' : '#fff',
        },
        grid: {
          display: false
        }
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
  };

  return (
    <div className="content">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h2 className="mb-0" style={{ fontSize: "1.5rem" }}>{project} - {month} {year}</h2>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "1.2rem", marginRight: "8px", opacity: theme === themes.dark ? 1 : 0.5 }}>🌙</span>
          <div
            onClick={() => changeTheme(theme === themes.dark ? themes.light : themes.dark)}
            style={{
              width: "50px",
              height: "24px",
              backgroundColor: theme === themes.light ? "#1d8cf8" : "#344675",
              borderRadius: "12px",
              position: "relative",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              border: "1px solid #1d8cf8"
            }}
          >
            <div style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "50%",
              position: "absolute",
              top: "1px",
              left: theme === themes.light ? "27px" : "2px",
              transition: "left 0.3s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }} />
          </div>
          <span style={{ fontSize: "1.2rem", marginLeft: "8px", opacity: theme === themes.light ? 1 : 0.5 }}>☀️</span>
        </div>
      </div>
      <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Combined data for all releases in this project.</p>

      {/* Summary Cards */}
      <Row>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openReleasesModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-primary" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-notes" style={{ fontSize: "1.5rem", color: "#9b59b6" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.65rem", marginBottom: "3px" }}>Releases</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{numberOfReleases}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openKlocModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-warning" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-trophy" style={{ fontSize: "1.5rem", color: "#f39c12" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>KLoc</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{totalKloc.toFixed(3)}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openBugsModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-danger" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-alert-circle-exc" style={{ fontSize: "1.5rem", color: "#e74c3c" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>Total Defects</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{totalBugs}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openDefectDensityModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-success" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-chart-bar-32" style={{ fontSize: "1.5rem", color: "#2ecc71" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>Bug Density</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{defectDensity}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openDreModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-info" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-check-2" style={{ fontSize: "1.5rem", color: "#3498db" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>DRE</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{dre}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openOpenPointsModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-warning" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-bullet-list-67" style={{ fontSize: "1.5rem", color: "#e91e63" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>Open Points</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{totalOpenPoints}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openManDaysModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-primary" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-calendar-60" style={{ fontSize: "1.5rem", color: "#1abc9c" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>Man Days</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{totalManDays}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 12.5%", maxWidth: "12.5%" }}>
          <Card className="card-stats" onClick={openCostModal} style={{ cursor: "pointer" }}>
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-success" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-money-coins" style={{ fontSize: "1.5rem", color: "#f1c40f" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>Total Cost</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.3rem", marginBottom: "0" }}>{formattedCost}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Project Totals and Bar Chart Row */}
      <Row className="mb-2" >
        {/* Left Column: Project Totals Table */}
        <Col md="6">
          {/* Project Totals Table */}
          <Card className="mb-0" style={{ marginBottom: "1rem" }}>
            <CardHeader className="d-flex justify-content-between align-items-center pe-3" style={{ padding: "0.75rem 1rem" }}>
              <CardTitle tag="h4" style={{ fontSize: "1rem", marginBottom: "0" }}>Releases Metrics</CardTitle>
              <div className="d-flex align-items-center gap-2">
                <label className="mb-0 fw-semibold" style={{ fontSize: "0.75rem" }}>Averages</label>
                <input
                  type="checkbox"
                  checked={showAverages}
                  onChange={() => setShowAverages((v) => !v)}
                  className="form-check-input"
                />
              </div>
            </CardHeader>
            <CardBody style={{ padding: "0.75rem", height: "280px", overflowY: "auto" }}>
              <Table className="tablesorter" style={{ fontSize: "0.75rem", marginBottom: "0", tableLayout: "fixed", width: "100%" }}>
                <thead className="text-primary">
                  <tr style={{ lineHeight: "1.2" }}>
                    <th style={{ padding: "0.4rem 0.3rem", width: "25%" }}>Field</th>
                    <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: showAverages ? "12.5%" : "25%" }}>Deliv.</th>
                    <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: showAverages ? "12.5%" : "25%" }}>Bugs</th>
                    <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: showAverages ? "12.5%" : "25%" }}>DD</th>
                    {showAverages && <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: "12.5%" }}>Avg Deliv.</th>}
                    {showAverages && <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: "12.5%" }}>Avg Bugs</th>}
                    {showAverages && <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: "12.5%" }}>Avg DD</th>}
                  </tr>
                </thead>
                <tbody>
                  {aggregatedRows.map((r, idx) => {
                    // Skip rows without both deliverables and bugs
                    if (
                      r.deliverables === undefined || r.deliverables === null ||
                      r.bugs === undefined || r.bugs === null
                    ) {
                      return null;
                    }

                    // Skip Engineering Efforts, rows starting with "Analysis", and all bug categorization rows
                    if (
                      r.row === "Engineering Efforts" ||
                      r.row === "ST" ||
                      r.row.startsWith("Analysis") ||
                      r.row === "Critical Bugs" ||
                      r.row === "Major Bugs" ||
                      r.row === "Minor Bugs" ||
                      r.row === "Low Bugs" ||
                      r.row === "System Test Requirement Bugs" ||
                      r.row === "System Test Design Bugs" ||
                      r.row === "System Test Coding Bugs" ||
                      r.row === "System Test UT Bugs" ||
                      r.row === "System Test Code Review Bugs" ||
                      r.row === "System Test Integration Bugs" ||
                      r.row === "Integration Testing Bugs" ||
                      r.row === "UAT Bugs" ||
                      r.row === "Go Live Bugs" ||
                      r.row === "Previous Phase Bugs" ||
                      r.row === "Current Phase Bugs"
                    ) {
                      return null;
                    }

                    // Get average values
                    const avgDeliverables = Number(averageData?.[r.row]?.avgDeliverables ?? 0);
                    const avgBugs = Number(averageData?.[r.row]?.avgBugs ?? 0);

                    const avgDefectDensity =
                      avgDeliverables > 0 ? (avgBugs / avgDeliverables).toFixed(2) : "-";

                    const defectDensityRow =
                      Number(r.deliverables) > 0
                        ? (Number(r.bugs) / Number(r.deliverables)).toFixed(2)
                        : "-";

                    const showRed =
                      showAverages &&
                      defectDensityRow !== "-" &&
                      avgDefectDensity !== "-" &&
                      Number(defectDensityRow) > Number(avgDefectDensity);

                    return (
                      <tr key={idx} style={{ lineHeight: "1.2" }}>
                        <td style={{ padding: "0.4rem 0.3rem" }}>{r.row}</td>
                        <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>
                          {r.row === "CD (Kloc)" ? Number(r.deliverables).toFixed(3) : r.deliverables}
                        </td>
                        <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>{r.bugs}</td>
                        <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>
                          {showRed ? (
                            <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                              {defectDensityRow}
                            </span>
                          ) : (
                            defectDensityRow
                          )}
                        </td>

                        {showAverages && (
                          <>
                            <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>
                              {avgDeliverables !== 0 ? avgDeliverables : "-"}
                            </td>
                            <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>{avgBugs !== 0 ? avgBugs : "-"}</td>
                            <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>
                              {avgDefectDensity !== "-" ? avgDefectDensity : "-"}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          <Row className="gx-2" style={{ marginTop: "1.82rem" }}>
            {/* Previous Phase vs Current Phase Bugs Chart */}
            <Col xs="12" md="4" className="mb-2">
              <Card className="card-chart">
                <CardHeader style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="card-category" style={{ fontSize: "0.85rem", marginBottom: "0" }}>
                    Prev vs Curr Phase Bugs
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {previousPhaseBugsTotal + currentPhaseBugsTotal}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <div className="chart-area" style={{ height: "255px" }}>
                    <Bar data={phaseComparisonData} options={phaseChartOptions} />
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Category Bar Chart */}
            <Col xs="12" md="8" className="mb-2">
              <Card className="card-chart">
                <CardHeader style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="card-category" style={{ fontSize: "0.85rem", marginBottom: "0" }}>
                    Defect Distribution by Category
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {categoryTotal}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem" }}>
                  <div className="chart-area" style={{ height: "255px", width: "100%" }}>
                    {categoryTotal > 0 ? (
                      <Bar data={categoryBarData} options={categoryBarOptions} />
                    ) : (
                      <p style={{ textAlign: "center", color: theme === themes.light ? "#1e1e2e" : "#ffffff" }}>No category data available</p>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Right Column: Pie Charts */}
        <Col md="6">
          <Row>
            {/* Pie Chart 1: Bug Severity */}
            <Col xs="12" md="6">
              <Card className="card-chart">
                <CardHeader style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="card-category" style={{ fontSize: "0.85rem", marginBottom: "0" }}>
                    Integration Testing Bug Distribution by Severity
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {totalCriticalBugs + totalMajorBugs + totalMinorBugs + totalLowBugs}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <div className="chart-area" style={{ height: "260px" }}>
                    <Pie data={severityPieData} options={pieChartOptions} />
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Pie Chart 2: Bug Types */}
            <Col xs="12" md="6">
              <Card className="card-chart">
                <CardHeader style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="card-category" style={{ fontSize: "0.85rem", marginBottom: "0" }}>
                    Bug Distribution by Phase Type
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {totalRequirementBugs + totalDesignBugs + totalCodingBugs + totalUTBugs + totalCodeReviewBugs + totalIntegrationBugs}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <div className="chart-area" style={{ height: "260px" }}>
                    <Pie data={bugTypePieData} options={pieChartOptions} />
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Doughnut Chart: Bug Testing Phase */}
            <Col xs="12" md="6" className="mb-2">
              <Card className="card-chart">
                <CardHeader style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="card-category" style={{ fontSize: "0.85rem", marginBottom: "0" }}>
                    Code Defects by Testing Phase
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {totalUnitTestBugs + totalIntegrationTestBugs + totalCodeReviewPhaseBugs}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <div className="chart-area" style={{ height: "255px" }}>
                    <Doughnut data={testingPhaseDoughnutData} options={pieChartOptions} />
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Testing Phase Bugs Comparison Chart */}
            <Col xs="12" md="6" className="mb-2">
              <Card className="card-chart">
                <CardHeader style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="card-category" style={{ fontSize: "0.85rem", marginBottom: "0" }}>
                    Testing Phase Bugs Comparison
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {integrationTestingBugsTotal + uatBugsTotal + goLiveBugsTotal}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <div className="chart-area" style={{ height: "255px" }}>
                    <Bar data={testingPhaseComparisonData} options={phaseChartOptions} />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Releases Breakdown - Hidden to save space, accessible via modal */}
      {false && releasesList.length > 0 && (
        <Row>
          <Col xs="12">
            <Card>
              <CardHeader style={{ padding: "0.75rem 1rem" }}>
                <CardTitle tag="h4" style={{ fontSize: "1rem", marginBottom: "0" }}>Releases in this Project</CardTitle>
              </CardHeader>
              <CardBody style={{ padding: "0.75rem" }}>
                <Row>
                  {releasesList.map((release) => {
                    const releaseRows = projectData[release] || [];
                    const releaseDeliverables = releaseRows
                      .filter(r => r.row !== "Man Days" && r.row !== "Engineering Efforts")
                      .reduce((s, r) => s + (Number(r.deliverables) || 0), 0);
                    const releaseBugs = releaseRows
                      .filter(r => r.row !== "Man Days" && r.row !== "Engineering Efforts")
                      .reduce((s, r) => s + (Number(r.bugs) || 0), 0);
                    return (
                      <Col lg="3" md="6" sm="12" key={release}>
                        <Card className="card-stats">
                          <CardBody>
                            <CardTitle tag="h5">{release}</CardTitle>
                            <p className="card-category">
                              Deliverables: <b>{releaseDeliverables}</b>
                            </p>
                            <p className="card-category">
                              Bugs: <b>{releaseBugs}</b>
                            </p>
                          </CardBody>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal for Release-wise Data */}
      <Modal
        isOpen={modalOpen}
        toggle={toggleModal}
        size="md"
        backdrop="static"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0
        }}
      >
        <div style={{
          background: theme === themes.light
            ? "linear-gradient(135deg, #f4f4f4 0%, #ffffff 50%, #f8f8f8 100%)"
            : "linear-gradient(135deg, #1e1e2e 0%, #27293d 50%, #2a2d42 100%)",
          borderRadius: "0",
          overflow: "hidden",
          position: "relative",
          boxShadow: theme === themes.light
            ? "0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(29, 140, 248, 0.3)"
            : "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(29, 140, 248, 0.2)"
        }}>
          <div style={{
            padding: "1.5rem 1.5rem 1rem 1.5rem",
            borderBottom: theme === themes.light ? "2px solid #e0e0e0" : "2px solid #344675",
            position: "relative",
            background: theme === themes.light
              ? "linear-gradient(135deg, #1d8cf8 0%, #3358f4 100%)"
              : "linear-gradient(135deg, #1d8cf8 0%, #3358f4 100%)"
          }}>
            <h3 style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "1.5rem",
              fontWeight: "600",
              paddingRight: "3rem"
            }}>
              {modalType === "mandays" && "Man Days Details"}
              {modalType === "cost" && "Cost Details"}
              {modalType === "bugs" && "Bugs Details"}
              {modalType === "defectdensity" && "Defect Density Details"}
              {modalType === "kloc" && "KLOC Details"}
              {modalType === "dre" && "DRE Details"}
              {modalType === "openpoints" && "Open Points Details"}
              {modalType === "releases" && "Releases Details"}
              {!modalType && "Project Details"}
            </h3>
            <button
              onClick={toggleModal}
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                right: "1rem",
                color: "#ffffff",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                fontSize: "1.5rem",
                fontWeight: "300",
                lineHeight: "1",
                cursor: "pointer",
                padding: "0.4rem 0.7rem",
                zIndex: 10,
                opacity: 1,
                borderRadius: "0.3rem",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              ×
            </button>
          </div>
          <ModalBody style={{
            background: theme === themes.light
              ? "linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)"
              : "linear-gradient(180deg, #27293d 0%, #1e1e2e 100%)",
            color: theme === themes.light ? "#1e1e2e" : "#ffffff",
            padding: "30px 20px 20px 20px",
            overflow: "hidden"
          }}>
            {modalType === "releases" ? (
              <Table className="tablesorter" style={{ marginBottom: 0, width: "100%", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{
                    background: theme === themes.light
                      ? "linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%)"
                      : "linear-gradient(135deg, #344675 0%, #2a3a5f 100%)",
                    borderRadius: "0.3rem"
                  }}>
                    <th style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Release Name</th>
                    <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Release Date</th>
                  </tr>
                </thead>
                <tbody>
                  {releaseWiseData.map((item, idx) => (
                    <tr key={idx} style={{
                      background: theme === themes.light
                        ? (idx % 2 === 0 ? "rgba(29, 140, 248, 0.08)" : "transparent")
                        : (idx % 2 === 0 ? "rgba(29, 140, 248, 0.05)" : "transparent"),
                      borderBottom: theme === themes.light
                        ? "1px solid rgba(0, 0, 0, 0.1)"
                        : "1px solid rgba(52, 70, 117, 0.3)"
                    }}>
                      <td style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        padding: "10px 12px"
                      }}>
                        <Link
                          to="/admin/dashboard"
                          state={{
                            year,
                            month,
                            project,
                            release: item.originalRelease
                          }}
                          style={{
                            color: "#1d8cf8",
                            textDecoration: "none",
                            transition: "color 0.3s ease"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = "#3358f4"}
                          onMouseOut={(e) => e.currentTarget.style.color = "#1d8cf8"}
                        >
                          {item.release}
                        </Link>
                      </td>
                      <td className="text-center" style={{ padding: "10px 12px" }}>{item.releaseDate}</td>
                    </tr>
                  ))}
                  {releaseWiseData.length > 0 && (
                    <tr style={{
                      fontWeight: "bold",
                      borderTop: "2px solid #1d8cf8",
                      background: "linear-gradient(135deg, rgba(29, 140, 248, 0.2) 0%, rgba(51, 88, 244, 0.2) 100%)"
                    }}>
                      <td style={{ padding: "12px" }}></td>
                      <td className="text-center" style={{ padding: "12px", fontSize: "0.95rem" }}>
                        Total Releases: <span style={{ fontSize: "1.4rem", marginLeft: "8px" }}>{releaseWiseData.length}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            ) : (
              <Table className="tablesorter" style={{ marginBottom: 0, width: "100%", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{
                    background: theme === themes.light
                      ? "linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%)"
                      : "linear-gradient(135deg, #344675 0%, #2a3a5f 100%)",
                    borderRadius: "0.3rem"
                  }}>
                    <th style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Release</th>
                    {modalType === "mandays" && <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Man Days</th>}
                    {modalType === "cost" && <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Cost (USD)</th>}
                    {modalType === "bugs" && <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Bugs</th>}
                    {modalType === "defectdensity" && <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Defect Density</th>}
                    {modalType === "kloc" && <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>KLoc</th>}
                    {modalType === "dre" && <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>DRE</th>}
                    {modalType === "openpoints" && <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Open Points</th>}
                    {!modalType && (
                      <>
                        <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Man Days</th>
                        <th className="text-center" style={{ fontSize: "1.1rem", color: theme === themes.light ? "#1e1e2e" : "#ffffff", padding: "12px" }}>Cost (USD)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {releaseWiseData.map((item, idx) => (
                    <tr key={idx} style={{
                      background: theme === themes.light
                        ? (idx % 2 === 0 ? "rgba(29, 140, 248, 0.08)" : "transparent")
                        : (idx % 2 === 0 ? "rgba(29, 140, 248, 0.05)" : "transparent"),
                      borderBottom: theme === themes.light
                        ? "1px solid rgba(0, 0, 0, 0.1)"
                        : "1px solid rgba(52, 70, 117, 0.3)"
                    }}>
                      <td style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        padding: "10px 12px"
                      }}>{item.release}</td>
                      {modalType === "mandays" && <td className="text-center" style={{ padding: "10px 12px" }}>{item.manDays}</td>}
                      {modalType === "cost" && <td className="text-center" style={{ padding: "10px 12px" }}>${item.cost.toLocaleString()}</td>}
                      {modalType === "bugs" && <td className="text-center" style={{ padding: "10px 12px" }}>{item.bugs}</td>}
                      {modalType === "defectdensity" && <td className="text-center" style={{ padding: "10px 12px" }}>{item.defectDensity}</td>}
                      {modalType === "kloc" && <td className="text-center" style={{ padding: "10px 12px" }}>{Number(item.kloc).toFixed(3)}</td>}
                      {modalType === "dre" && <td className="text-center" style={{ padding: "10px 12px" }}>{item.dre}</td>}
                      {modalType === "openpoints" && <td className="text-center" style={{ padding: "10px 12px" }}>{item.openPoints}</td>}
                      {!modalType && (
                        <>
                          <td className="text-center" style={{ padding: "10px 12px" }}>{item.manDays}</td>
                          <td className="text-center" style={{ padding: "10px 12px" }}>${item.cost.toLocaleString()}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {releaseWiseData.length > 0 && (
                    <tr style={{
                      fontWeight: "bold",
                      borderTop: "2px solid #1d8cf8",
                      fontSize: "1.15rem",
                      background: "linear-gradient(135deg, rgba(29, 140, 248, 0.2) 0%, rgba(51, 88, 244, 0.2) 100%)"
                    }}>
                      <td style={{ padding: "12px" }}>Total</td>
                      {modalType === "mandays" && <td className="text-center" style={{ padding: "12px" }}>{totalManDays}</td>}
                      {modalType === "cost" && <td className="text-center" style={{ padding: "12px" }}>{formattedCost}</td>}
                      {modalType === "bugs" && <td className="text-center" style={{ padding: "12px" }}>{totalBugs}</td>}
                      {modalType === "defectdensity" && <td className="text-center" style={{ padding: "12px" }}>{defectDensity}</td>}
                      {modalType === "kloc" && <td className="text-center" style={{ padding: "12px" }}>{totalKloc.toFixed(3)}</td>}
                      {modalType === "dre" && <td className="text-center" style={{ padding: "12px" }}>{dre}</td>}
                      {modalType === "openpoints" && <td className="text-center" style={{ padding: "12px" }}>{totalOpenPoints}</td>}
                      {!modalType && (
                        <>
                          <td className="text-center" style={{ padding: "12px" }}>{totalManDays}</td>
                          <td className="text-center" style={{ padding: "12px" }}>{formattedCost}</td>
                        </>
                      )}
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </ModalBody>
        </div>
      </Modal>
    </div>
  );
}

export default ProjectDashboard;
