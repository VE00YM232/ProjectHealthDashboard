/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Akanshu Raj
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: View Dashboard
* Description
* -----------------------------------------------------------------------------------
* Contains components for dashboard screen
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Akanshu Raj          Jan 12, 2026        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
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
} from "reactstrap";

// Register the datalabels plugin
ChartJS.register(ChartDataLabels);

function Dashboard() {
  const location = useLocation();
  const { year, month, project, release } = location.state || {};
  const { data } = useGlobalData();
  const { theme, changeTheme } = useContext(ThemeContext);

  if (!year || !month || !project || !release) {
    return (
      <div className="content">
        <h2>Dashboard</h2>
        <p>Please select a project release from the sidebar.</p>
      </div>
    );
  }

  // Grab rows for the selected release
  const releaseData = data?.[year]?.[month]?.[project]?.[release];
  // Handle both new {rows, categoryData} format and old array format
  const rows = releaseData && releaseData.rows ? releaseData.rows : (releaseData || []);

  if (!rows.length) {
    return (
      <div className="content">
        <h2>{project} - {release} ({month} {year})</h2>
        <p>No KPI data available.</p>
      </div>
    );
  }

  // Extract bug categorization from rows
  const totalCriticalBugs = rows.find(r => r.row === "Critical Bugs")?.bugs || 0;
  const totalMajorBugs = rows.find(r => r.row === "Major Bugs")?.bugs || 0;
  const totalMinorBugs = rows.find(r => r.row === "Minor Bugs")?.bugs || 0;
  const totalLowBugs = rows.find(r => r.row === "Low Bugs")?.bugs || 0;

  // Bug Distribution by Type
  const totalRequirementBugs = rows.find(r => r.row === "Analysis Requirement Bugs")?.bugs || 0;
  const totalDesignBugs = rows.find(r => r.row === "Analysis Design Bugs")?.bugs || 0;
  const totalCodingBugs = rows.find(r => r.row === "Analysis Coding Bugs")?.bugs || 0;
  const totalUTBugs = rows.find(r => r.row === "Analysis UT Bugs")?.bugs || 0;
  const totalCodeReviewBugs = rows.find(r => r.row === "Analysis Code Review Bugs")?.bugs || 0;
  const totalIntegrationBugs = rows.find(r => r.row === "Analysis Integration Bugs")?.bugs || 0;

  // Bug categorization by testing phase
  const totalUnitTestBugs = rows.find(r => r.row === "MT/UT(No of Unit Test cases)")?.bugs || 0;
  const totalIntegrationTestBugs = rows.find(r => r.row === "IT(No of Test cases)")?.bugs || 0;
  const totalCodeReviewPhaseBugs = rows.find(r => r.row === "CD (Kloc)")?.bugs || 0;

  // Get Previous Phase vs Current Phase Bugs
  const previousPhaseBugsTotal = rows.find(r => r.row === "Previous Phase Bugs")?.bugs || 0;
  const currentPhaseBugsTotal = rows.find(r => r.row === "Current Phase Bugs")?.bugs || 0;

  // Get Integration Testing, UAT, and Go Live Bugs
  const integrationTestingBugsTotal = rows.find(r => r.row === "Integration Testing Bugs")?.bugs || 0;
  const uatBugsTotal = rows.find(r => r.row === "UAT Bugs")?.bugs || 0;
  const goLiveBugsTotal = rows.find(r => r.row === "Go Live Bugs")?.bugs || 0;

  // Extract category data
  let categoryData = {};
  if (releaseData && releaseData.categoryData) {
    categoryData = releaseData.categoryData;
  }

  const categoryLabels = Object.keys(categoryData);
  const categoryValues = Object.values(categoryData);
  const categoryTotal = categoryValues.reduce((sum, val) => sum + val, 0);

  // Calculate tiles data
  const totalManDays = Number(rows.find(r => r.row === "Man Days")?.deliverables || 0);
  const totalKloc = rows.find(r => r.row === "CD (Kloc)")?.deliverables || 0;
  
  const totalBugs = rows
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

  const totalDeliverables = rows
    .filter(r => r.row !== "Man Days" && r.row !== "Engineering Efforts")
    .reduce((sum, r) => sum + (Number(r.deliverables) || 0), 0);

  const defectDensity = totalDeliverables > 0 ? (totalBugs / totalDeliverables).toFixed(2) : "0.00";

  // Calculate DRE
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

  const costPerManDay = 250;
  const totalCost = totalManDays * costPerManDay;
  const formattedCost = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(totalCost);

  // Category bar chart data
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
          '#ff5722'
        ],
        borderColor: theme === themes.light ? '#ffffff' : '#27293d',
        borderWidth: 2,
      }
    ]
  };

  const categoryBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: theme === themes.light ? '#1e1e2e' : '#ffffff',
        font: { weight: 'bold', size: 12 },
        formatter: (value) => value
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grace: '10%',
        ticks: {
          precision: 0,
          color: theme === themes.light ? '#1e1e2e' : '#ffffff'
        },
        grid: {
          color: theme === themes.light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: theme === themes.light ? '#1e1e2e' : '#ffffff',
          font: { size: 11 }
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };

  // Phase comparison data
  const phaseComparisonData = {
    labels: ['Previous Phase', 'Current Phase'],
    datasets: [
      {
        label: 'Bugs',
        data: [previousPhaseBugsTotal, currentPhaseBugsTotal],
        backgroundColor: ['#1f8ef1', '#00d6b4'],
        borderColor: theme === themes.light ? '#ffffff' : '#27293d',
        borderWidth: 2,
      }
    ]
  };

  // Testing phase comparison data
  const testingPhaseComparisonData = {
    labels: ['Integration Testing', 'UAT', 'Production'],
    datasets: [
      {
        label: 'Bugs',
        data: [integrationTestingBugsTotal, uatBugsTotal, goLiveBugsTotal],
        backgroundColor: ['#fd5d93', '#ffc107', '#e14eca'],
        borderColor: theme === themes.light ? '#ffffff' : '#27293d',
        borderWidth: 2,
      }
    ]
  };

  const phaseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: theme === themes.light ? '#1e1e2e' : '#ffffff',
        font: { weight: 'bold', size: 14 },
        formatter: (value) => value
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: {
          precision: 0,
          color: theme === themes.light ? '#1e1e2e' : '#ffffff'
        },
        grid: {
          color: theme === themes.light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: theme === themes.light ? '#1e1e2e' : '#ffffff'
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };

  // Severity pie chart
  const severityPieData = {
    labels: ['Critical', 'Major', 'Minor', 'Low'],
    datasets: [
      {
        data: [totalCriticalBugs, totalMajorBugs, totalMinorBugs, totalLowBugs],
        backgroundColor: ['#e74c3c', '#f39c12', '#f1c40f', '#3498db'],
        borderWidth: 0,
        hoverOffset: 15,
        hoverBorderWidth: 0,
      }
    ]
  };

  // Bug type pie chart
  const bugTypePieData = {
    labels: ['Requirement', 'Design', 'Coding', 'UT', 'Code Review', 'Integration'],
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
        backgroundColor: ['#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#f39c12', '#e67e22'],
        borderWidth: 0,
        hoverOffset: 15,
        hoverBorderWidth: 0,
      }
    ]
  };

  // Testing phase doughnut chart
  const testingPhaseDoughnutData = {
    labels: ['Unit Test', 'Integration Test', 'Code Review'],
    datasets: [
      {
        data: [totalUnitTestBugs, totalIntegrationTestBugs, totalCodeReviewPhaseBugs],
        backgroundColor: ['#1f8ef1', '#00d6b4', '#fd5d93'],
        borderWidth: 0,
        hoverOffset: 15,
        hoverBorderWidth: 0,
      }
    ]
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
        position: 'bottom',
        labels: {
          color: theme === themes.light ? '#1e1e2e' : '#ffffff',
          padding: 10,
          font: { size: 11 }
        }
      },
      datalabels: {
        color: '#ffffff',
        font: { weight: 'bold', size: 12 },
        formatter: (value) => {
          if (value === 0) return '';
          return value;
        }
      }
    }
  };

  // Phase-wise analysis bar chart data
  const validRows = rows.filter((r) => {
    const d = Number(r.deliverables);
    const b = Number(r.bugs);
    return !isNaN(d) && !isNaN(b) && d !== null && b !== null;
  });

  const chartRows = validRows.filter(r =>
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

  const labels = chartRows.map((r) => r.row);
  const bugsData = chartRows.map((r) => Number(r.bugs));

  const horizontalChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: theme === themes.light ? '#1e1e2e' : '#ffffff',
        font: { weight: 'bold', size: 11 },
        formatter: (value) => value > 0 ? value : ''
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: theme === themes.light ? '#1e1e2e' : '#ffffff'
        },
        grid: {
          color: theme === themes.light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: theme === themes.light ? '#1e1e2e' : '#ffffff',
          font: { size: 10 }
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };

  return (
    <div className="content">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-0">
          {project} - {release} ({month} {year})
        </h2>
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

      {/* Summary Cards */}
      <Row>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 16.66%", maxWidth: "16.66%" }}>
          <Card className="card-stats">
            <CardBody style={{ padding: "10px" }}>
              <Row>
                <Col xs="12">
                  <div className="info-icon text-center icon-warning" style={{ marginBottom: "8px" }}>
                    <i className="tim-icons icon-trophy" style={{ fontSize: "1.5rem", color: "#f39c12" }} />
                  </div>
                  <div className="numbers text-center">
                    <p className="card-category" style={{ fontSize: "0.75rem", marginBottom: "3px" }}>KLoc</p>
                    <CardTitle tag="h3" style={{ fontSize: "1.5rem", marginBottom: "0" }}>{totalKloc}</CardTitle>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 16.66%", maxWidth: "16.66%" }}>
          <Card className="card-stats">
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
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 16.66%", maxWidth: "16.66%" }}>
          <Card className="card-stats">
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
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 16.66%", maxWidth: "16.66%" }}>
          <Card className="card-stats">
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
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 16.66%", maxWidth: "16.66%" }}>
          <Card className="card-stats">
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
        <Col xl="1" lg="3" md="4" sm="6" style={{ flex: "1 1 16.66%", maxWidth: "16.66%" }}>
          <Card className="card-stats">
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

      <Row>
        {/* Left Column */}
        <Col md="6">
          {/* Details Table */}
          <Card className="mb-2">
            <CardHeader className="d-flex justify-content-between align-items-center pe-3" style={{ padding: "0.75rem 1rem" }}>
              <CardTitle tag="h4" style={{ fontSize: "1rem", marginBottom: "0" }}>Release Details</CardTitle>
            </CardHeader>
            <CardBody style={{ padding: "0.75rem", height: "280px", overflowY: "auto" }}>
              <Table className="tablesorter" style={{ fontSize: "0.75rem", marginBottom: "0", tableLayout: "fixed", width: "100%" }}>
                <thead className="text-primary">
                  <tr style={{ lineHeight: "1.2" }}>
                    <th style={{ padding: "0.4rem 0.3rem", width: "40%" }}>Field</th>
                    <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: "20%" }}>Deliverables</th>
                    <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: "20%" }}>Bugs</th>
                    <th className="text-center" style={{ padding: "0.4rem 0.3rem", width: "20%" }}>Defect Density</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    if (
                      r.deliverables === undefined || r.deliverables === null ||
                      r.bugs === undefined || r.bugs === null
                    ) {
                      return null;
                    }

                    // Skip Engineering Efforts and all bug categorization rows
                    if (
                      r.row === "Engineering Efforts" ||
                      r.row === "ST" ||
                      r.row === "Critical Bugs" ||
                      r.row === "Major Bugs" ||
                      r.row === "Minor Bugs" ||
                      r.row === "Low Bugs" ||
                      r.row === "System Test Requirement Bugs" ||
                      r.row === "System Test Design Bugs" ||
                      r.row === "System Test Coding Bugs" ||
                      r.row === "System Test UT Bugs" ||
                      r.row === "System Test Code Review Bugs" ||
                      r.row === "System Test Integration Bugs"
                    ) {
                      return null;
                    }

                    const defectDensityRow =
                      Number(r.deliverables) > 0
                        ? (Number(r.bugs) / Number(r.deliverables)).toFixed(2)
                        : "-";

                    return (
                      <tr key={idx} style={{ lineHeight: "1.2" }}>
                        <td style={{ padding: "0.4rem 0.3rem" }}>{r.row}</td>
                        <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>{r.deliverables}</td>
                        <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>{r.bugs}</td>
                        <td className="text-center" style={{ padding: "0.4rem 0.3rem" }}>
                          {defectDensityRow}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          <Row className="gx-2" style={{ marginTop: "1.85rem" }}>
            {/* Previous Phase vs Current Phase Bugs Chart */}
            <Col xs="12" md="4" className="mb-2">
              <Card className="card-chart">
                <CardHeader style={{ padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 className="card-category" style={{ fontSize: "0.85rem", marginBottom: "0" }}>
                    Prev and Curr Phase Bugs
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {previousPhaseBugsTotal + currentPhaseBugsTotal}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <div className="chart-area" style={{ height: "234px" }}>
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
                    Code Defects by Category
                  </h5>
                  <span style={{ fontSize: "0.85rem" }}><strong>Total: {categoryTotal}</strong></span>
                </CardHeader>
                <CardBody style={{ paddingBottom: "10px", padding: "0.75rem" }}>
                  <div className="chart-area" style={{ height: "234px", width: "100%" }}>
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
                  <div className="chart-area" style={{ height: "254px" }}>
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
                  <div className="chart-area" style={{ height: "254px" }}>
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
                  <div className="chart-area" style={{ height: "234px" }}>
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
                  <div className="chart-area" style={{ height: "234px" }}>
                    <Bar data={testingPhaseComparisonData} options={phaseChartOptions} />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
