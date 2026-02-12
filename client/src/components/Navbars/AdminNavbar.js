/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: component Navbar
* Description
* -----------------------------------------------------------------------------------
* Component for Admin Navbar
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import Swal from "sweetalert2";
import ExcelJS from "exceljs";
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ThemeContext, themes } from "contexts/ThemeContext";


// reactstrap components (v9 syntax)
import {
  Button,
  Collapse,
  NavbarBrand,
  Navbar,
  NavItem,
  Nav,
  Container,
  NavbarToggler,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalHeader,
  Input,
  Spinner,
  UncontrolledDropdown,
  Label,
  UncontrolledTooltip
} from "reactstrap";

import { useGlobalData } from "contexts/GlobalContext";
Chart.register(...registerables);


function AdminNavbar(props) {
// Remove duplicate useGlobalData calls
const { data, reloadData, loading } = useGlobalData();
const navigate = useNavigate();
const { theme } = useContext(ThemeContext);

// States for UI logic
const [syncLoading, setSyncLoading] = useState({
  active: false,
  text: "",
});
const [collapseOpen, setCollapseOpen] = useState(false);
const [modalSearch, setModalSearch] = useState(false);

const [color, setColor] = useState("navbar-transparent");
const [profileOpen, setProfileOpen] = useState(false);
const [notificationOpen, setNotificationOpen] = useState(false);
const [isDashboardReady, setIsDashboardReady] = useState(false);
const [selectedYear, setSelectedYear] = useState("");

// Correct: mobile view state detected once and updated on resize
const [isMobileView, setIsMobileView] = useState(window.innerWidth < 992);

// Get SSO user info from sessionStorage
const [userInfo, setUserInfo] = useState(null);

useEffect(() => {
  const msalUser = sessionStorage.getItem('msalUser');
  if (msalUser) {
    try {
      setUserInfo(JSON.parse(msalUser));
    } catch (err) {
      console.error("Error parsing user info:", err);
    }
  }
}, []);

// Compute available years and months safely
const availableYears = data ? Object.keys(data) : [];
const months = Array.from({ length: 12 }, (_, i) => {
  const label = new Date(0, i).toLocaleString("default", { month: "long" });
  return { label, value: label };
});

// UI toggle handlers
const toggleProfile = () => setProfileOpen(prev => !prev);
const toggleNotification = () => setNotificationOpen(prev => !prev);

// Responsive listener (runs once, dependency array empty)
useEffect(() => {
  const handleResize = () => setIsMobileView(window.innerWidth < 992);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

// Navbar color handler (depends on collapseOpen)
useEffect(() => {
  const updateColor = () => {
    if (window.innerWidth < 993 && collapseOpen) {
      setColor("bg-white");
    } else {
      setColor("navbar-transparent");
    }
  };
  window.addEventListener("resize", updateColor);
  // Run once on mount and anytime collapseOpen changes
  updateColor();
  return () => window.removeEventListener("resize", updateColor);
}, [collapseOpen]);


const toggleCollapse = () => {
  setColor(collapseOpen ? "navbar-transparent" : "bg-white");
  setCollapseOpen(!collapseOpen);
};

// Dashboard "ready" state check using MutationObserver
useEffect(() => {
  const checkDashboard = () => {
    const element = props.mainPanelRef?.current;
    const headerDiv = element?.querySelector(
      "div.d-flex.justify-content-between.align-items-center.mb-2"
    );
    setIsDashboardReady(!!headerDiv);
  };
  checkDashboard();
  const observer = new MutationObserver(checkDashboard);
  if (props.mainPanelRef?.current) {
    observer.observe(props.mainPanelRef.current, {
      childList: true,
      subtree: true,
    });
  }
  return () => observer.disconnect();
}, [props.mainPanelRef]);

const toggleModalSearch = () => {
  setModalSearch(!modalSearch);
};

  /**
   *  Syncs all KPI data
   */
  const syncAllData = async () => {
    try {
      setSyncLoading({ active: true, text: "Syncing all data... Please wait" });
      const res = await fetch("/syncAllKPIData");
      const data = await res.json();
      if (data.message === "success") {
        await reloadData();
        Swal.fire({
          icon: "success",
          title: "Synced!",
          text: "All data synced successfully",
          confirmButtonColor: "#1d8cf8",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Failed to sync all data: ${data.message}`,
          confirmButtonColor: "#f5365c",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to sync all data: " + err.message,
        confirmButtonColor: "#f5365c",
      });
    } finally {
      setSyncLoading({ active: false, text: "" });
    }
  };

  /**
   *  Syncs the current month's KPI data
   */
  const syncCurrentMonth = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.toLocaleString("en-US", { month: "short" });
      setSyncLoading({
        active: true,
        text: `Syncing ${month} ${year} data... Please wait`,
      });

      const res = await fetch("/uploadMonthKPIData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });

      const data = await res.json();
      if (data.message === "success") {
        await reloadData();
        Swal.fire({
          icon: "success",
          title: "Synced!",
          text: `${data.message} for ${month} ${year}`,
          confirmButtonColor: "#1d8cf8",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error Syncing for ${month} ${year} - ${data.error}`,
          confirmButtonColor: "#f5365c",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to sync current month: " + err.message,
        confirmButtonColor: "#f5365c",
      });
    } finally {
      setSyncLoading({ active: false, text: "" });
    }
  };

  /**
 *  Logout handler
 */
  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('msalUser');
    // Clear any auth state if needed
    navigate("/login", { replace: true });
  };
  /**
   *  Creates a base Excel workbook with default properties
   */
  const createBaseWorkbook = () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "YMSLI Dashboard";
    workbook.created = new Date();
    return workbook;
  };

  /**
   *  Adds a header section to the worksheet
   * @param {*} worksheet Excel worksheet object
   * @param {*} projectName Name of the project
   * @param {*} releaseName Name of the release
   * @param {*} efforts Engineering efforts
   * @param {*} manDays Man days
   */
  const addHeaderSection = (worksheet, projectName, releaseName, efforts, manDays, isMonthlyReport) => {

    // --- Title row (Row 1) ---
    isMonthlyReport
      ? worksheet.addRow(["", "Consolidated Monthly Report"])
      : worksheet.addRow(["", "Release Report"]);

    const titleRow = worksheet.lastRow;
    const titleCell = titleRow.getCell(2);

    // Apply styling to the title cell
    titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "5A5A5A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

    worksheet.mergeCells(titleRow.number, 2, titleRow.number, 11);

    // Apply border on merged title row
    for (let c = 2; c <= 11; c++) {
      const cell = titleRow.getCell(c);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    }

    // ---------- Spacing row ----------
    worksheet.addRow([]);

    // ---------- Project / Efforts row ----------
    worksheet.addRow([
      "",
      "Project Name:",
      projectName,
      "",
      "",
      "",
      "",
      "Engineering Efforts:",
      efforts,
      "Man Days:",
      manDays,
    ]);

    // Optional: style the project row here if needed — your table function also handles this
    const projectRow = worksheet.lastRow;

    projectRow.eachCell((cell, colNumber) => {
      if (colNumber === 1) return; // skip empty first column

      cell.font = { bold: true, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // Wrap project name column explicitly
    projectRow.getCell(3).alignment = { wrapText: true };

    // ---------- Spacing row ----------
    worksheet.addRow([]);
  };


  /**
   *  Adds a styled table to the worksheet
   * @param {*} worksheet Excel worksheet object
   * @param {*} headers Array of table headers
   * @param {*} rows Array of data rows
   */
  const addStyledTable = (worksheet, headers, rows) => {

    // Add header row shifted right by one column
    worksheet.addRow(["", ...headers]);
    const headerRowIndex = worksheet.lastRow.number;

    // Add data rows (each shifted right by one)
    rows.forEach((r) => {
      const cleanRow = r.map((cellValue) => {
        if (cellValue === null || cellValue === undefined) return "";
        if (typeof cellValue === "number") return cellValue;
        // numeric string -> Number
        if (!isNaN(cellValue) && cellValue.toString().trim() !== "") return Number(cellValue);
        // date detection
        const dateMatch = cellValue.toString().match(/^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/);
        if (dateMatch) return new Date(cellValue);
        return cellValue.toString().trim();
      });

      // SHIFT: leave first column empty
      const newRow = worksheet.addRow(["", ...cleanRow]);
      newRow.eachCell((cell) => (cell.numFmt = "General"));
    });

    // ---------- Header styling (skip column 1) ----------
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.eachCell((cell, colNumber) => {
      if (colNumber === 1) return; // skip first (empty) column
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "5A5A5A" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ---------- Identify & style the project/details row above the header ----------
    // We search rows above the headerRowIndex for a cell that contains "Project Name"
    let projectRowIndex = null;
    for (let r = 1; r < headerRowIndex; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= row.cellCount; c++) {
        const v = row.getCell(c).value;
        if (typeof v === "string" && v.trim().toLowerCase().startsWith("project name")) {
          projectRowIndex = r;
          break;
        }
      }
      if (projectRowIndex) break;
    }

    if (projectRowIndex) {
      const projectRow = worksheet.getRow(projectRowIndex);

      // find the column that contains the project name (immediately after the "Project Name" label)
      let projectNameCol = null;
      for (let c = 1; c <= projectRow.cellCount; c++) {
        const v = projectRow.getCell(c).value;
        if (typeof v === "string" && v.trim().toLowerCase().startsWith("project name")) {
          projectNameCol = c + 1; // project name expected in next column
          break;
        }
      }

      // apply styling to the entire project row, but skip column 1
      projectRow.eachCell((cell, colNumber) => {
        if (colNumber === 1) return;
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // wrap the project name cell (if found)
      if (projectNameCol) {
        projectRow.getCell(projectNameCol).alignment = {
          wrapText: true,
          horizontal: "left",
          vertical: "middle",
        };
      }

      // detect effort/man-days columns by their header labels if present and format them
      // (they might be e.g. "Engineering Efforts:" and "Man Days:" in the same project row)
      for (let c = 1; c <= projectRow.cellCount; c++) {
        const val = projectRow.getCell(c).value;
        if (typeof val === "string") {
          const lower = val.toLowerCase();
          if (lower.includes("engineering effort") || lower.includes("engineering efforts")) {
            // numeric value should be one or two cols to the right, try col+1
            const vcell = projectRow.getCell(c + 1);
            if (vcell) {
              vcell.numFmt = "0.00";
              vcell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
            }
          }
          if (lower.includes("man day") || lower.includes("man days")) {
            const vcell = projectRow.getCell(c + 1);
            if (vcell) {
              vcell.numFmt = "0.00";
              vcell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
            }
          }
        }
      }
    }

    // ---------- Alternate row shading and borders for data rows (skip col 1) ----------
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > headerRowIndex) {
        row.eachCell((cell, colNumber) => {
          if (colNumber === 1) return; // do not style the empty first column
          // ensure alignment & border
          cell.alignment = { vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        // alternate shading on visible data columns
        if (rowNumber % 2 === 0) {
          row.eachCell((cell, colNumber) => {
            if (colNumber === 1) return;
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8F9FA" } };
          });
        }
      }
    });
  };



  /**
   *  Auto fits columns based on content
   * @param {*} worksheet Excel worksheet object
   */
  const autoFitColumns = (worksheet) => {
    worksheet.columns.forEach((column, idx) => {
      const colIndex = idx + 1;
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value;
        let cellLength = 0;
        if (v === null || v === undefined) cellLength = 0;
        else if (typeof v === "object" && v.richText) {
          cellLength = v.richText.map((r) => r.text || "").join("").length;
        } else {
          cellLength = v.toString().length;
        }
        if (cellLength > maxLength) maxLength = cellLength;
      });

      // Base width (characters) with a small padding
      let computedWidth = Math.max(3, Math.min(maxLength + 2, 80));

      if (colIndex === 1) {
        // spacer column — keep small
        computedWidth = 2;
      } else if (colIndex === 2) {
        // primary text column (row/title) — allow wrapping and a reasonable max
        const minW = 12;
        const maxW = 30; // reduce from previous 40
        computedWidth = Math.max(minW, Math.min(computedWidth, maxW));
      } else {
        // other columns (likely numeric) — keep compact
        const minW = 8;
        const maxW = 16;
        computedWidth = Math.max(minW, Math.min(computedWidth, maxW));
      }

      column.width = computedWidth;
    });
  };

  /**
   *  Saves the workbook as an Excel file
   * @param {*} workbook ExcelJS workbook object
   * @param {*} fileName Desired file name
   */
  const saveWorkbook = async (workbook, fileName) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  /**
   *  Renders a chart image using Chart.js and returns base64 PNG
   * @param {*} labels Array of labels for x-axis
   * @param {*} data Array of numeric data points
   * @param {*} title Chart title
   * @param {*} color Bar color
   */
  async function renderChartImage({ labels, data, title, color }) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // --- Dynamic canvas size ---
    const dynamicHeight = Math.max(300, 400); // keep consistent height for vertical bars
    canvas.height = dynamicHeight;
    canvas.width = Math.max(800, labels.length * 100); // scale width by label count

    // --- Compute scale dynamically ---
    const maxValue = Math.max(...data, 0);
    const yMax = maxValue <= 10 ? 10 : Math.ceil(maxValue * 1.1);

    // --- Create vertical bar chart ---
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false, // required for offscreen rendering
        animation: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: "bold" },
          },
          legend: { display: false },
          datalabels: {
            color: "#000",
            anchor: "end",
            align: "top",
            formatter: (val) => val,
            font: { size: 12 },
          },
        },
        scales: {
          x: {
            ticks: {
              font: {
                style: "italic",
                size: 12,
                weight: "bold",
              },
              color: "#000",
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            max: yMax,
            ticks: {
              font: { 
                size: 12,
                weight: "bold"
               },
              color: "#000",
            },
            grid: {
              drawBorder: false,
              color: "rgba(0,0,0,0.25)",  // darker
              lineWidth: 1.5,            // thicker grid lines
            },
          },
        },

      },
      plugins: [ChartDataLabels],
    });

    // --- Wait for rendering ---
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Export the chart canvas to a base64 image first
    let chartBase64;
    try {
      chartBase64 = chart.toBase64Image("image/png", 1.0);
    } catch (err) {
      console.error("Chart export failed:", err);
      chart.destroy();
      canvas.remove();
      return null;
    }

    // Cleanup the Chart.js instance and original canvas
    chart.destroy();

    // Create an offscreen image to composite border without clipping issues
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = chartBase64;
    }).catch((err) => {
      console.error("Failed to load chart image:", err);
      canvas.remove();
      return null;
    });

    if (!img) return null;

    // Padding around original chart to ensure border fully visible after Excel insertion
    const pad = 4; // px
    const outW = img.width + pad * 2;
    const outH = img.height + pad * 2;

    const outCanvas = document.createElement("canvas");
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext("2d");

    // Optional: fill background white so Excel shows a consistent background
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, outW, outH);

    // Draw the chart image centered with padding
    outCtx.drawImage(img, pad, pad, img.width, img.height);

    // Draw border fully inside the output canvas
    const lineWidth = 2;
    outCtx.strokeStyle = "rgba(0,0,0,0.75)";
    outCtx.lineWidth = lineWidth;
    outCtx.lineJoin = "round";
    const inset = Math.max(1, Math.ceil(lineWidth / 2));
    outCtx.beginPath();
    // pixel-align for crispness
    outCtx.rect(inset + 0.5, inset + 0.5, outW - inset * 2 - 1, outH - inset * 2 - 1);
    outCtx.stroke();

    // Final export
    const finalBase64 = outCanvas.toDataURL("image/png", 1.0);

    // Remove original canvas to free memory
    canvas.remove();

    if (!finalBase64.startsWith("data:image/png;base64,")) {
      console.error("Invalid final image data:", finalBase64.slice(0, 50));
      return null;
    }

    return finalBase64;
  }

  /**
   *  Adds charts to the worksheet
   * @param {*} workbook ExcelJS workbook object
   * @param {*} worksheet ExcelJS worksheet object
   * @param {*} rows Data rows for chart generation
   */
  const AddChartsToWorksheet = async (workbook, worksheet, rows) => {
    try {
      // --- Extract labels and numeric data dynamically ---
      const labels = rows.map((r) => r[0]); // assuming first column = category name
      const deliverablesData = rows.map((r) => parseFloat(r[1]) || 0); // assuming second column = deliverables
      const bugsData = rows.map((r) => parseFloat(r[2]) || 0); // assuming third column = bugs

      // --- Generate chart images via renderChartImage() ---
      const deliverablesImg = await renderChartImage({
        labels,
        data: deliverablesData,
        title: "Deliverables Chart",
        color: "rgba(54,162,235,1)",
      });

      const bugsImg = await renderChartImage({
        labels,
        data: bugsData,
        title: "Bugs Chart",
        color: "rgba(255,99,132,1)",
      });

      if (!deliverablesImg || !bugsImg)
        throw new Error("Failed to render one or both chart images.");

      const deliverablesImgId = workbook.addImage({
        base64: deliverablesImg,
        extension: "png",
      });
      const bugsImgId = workbook.addImage({
        base64: bugsImg,
        extension: "png",
      });

      // --- Add chart titles and layout ---
      let imageRowStart = worksheet.lastRow.number + 4;

      // --- Insert chart images ---
      worksheet.addImage(deliverablesImgId, {
        tl: { col: 1.3, row: imageRowStart },
        ext: { width: 350, height: 250 },
      });
      worksheet.addImage(bugsImgId, {
        tl: { col: 6.3, row: imageRowStart },
        ext: { width: 350, height: 250 },
      });
    } catch (err) {
      console.error("AddChartsToWorksheet error:", err);
    }
  };

  const createWorkAnalysisWorkbook = async (workbook, year, month) => {
    const sheet = workbook.addWorksheet("Summary", {
      views: [{ showGridLines: false }]
    });



    if (!data || !data[year] || !data[year][month]) {
      console.warn(` No data found for ${month} ${year}`);
      sheet.addRow(["", "", "Total"]);
      return;
    }

    const monthData = data[year][month];

    // ---- collect releases ----
    const releases = [];
    for (const [project, releasesObj] of Object.entries(monthData)) {
      for (const [releaseName, rows] of Object.entries(releasesObj)) {
        releases.push({
          title: `${releaseName} - ${project.toUpperCase()}`,
          rows,
        });
      }
    }

    // safe numeric parse
    const toNumber = (v) => {
      if (v === undefined || v === null || v === "") return 0;
      if (typeof v === "string") {
        const cleaned = v.replace(/,/g, "").trim();
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : 0;
      }
      return typeof v === "number" ? v : 0;
    };

    const getValue = (release, key, field = "bugs") => {
      const found = release.rows.find((r) => String(r.row).trim() === key);
      return toNumber(found?.[field]);
    };

    const getTotals = (key, field = "bugs") =>
      releases.reduce((sum, r) => sum + getValue(r, key, field), 0);

    // === build header row (A,B,C = '', '', 'Total', then release titles) ===
    const header = ["", "", "Total", ...releases.map((r) => r.title)];
    sheet.addRow(header);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // === GENERAL ===
    addMergedSection(sheet, "General", [
      ["Start Date", "", ...new Array(releases.length).fill("")],
      ["Release Date", "", ...new Array(releases.length).fill("")],
    ]);

    // === BUG COUNT ===
    addMergedSection(sheet, "Bug Count", [
      ["Internal", getTotals("IT(No of Test cases)", "bugs"), ...releases.map(r => getValue(r, "IT(No of Test cases)", "bugs"))],
      ["Lead Verification", getTotals("Lead Verification", "bugs"), ...releases.map(r => getValue(r, "Lead Verification", "bugs"))],
      ["YMC", getTotals("YMC", "bugs"), ...releases.map(r => getValue(r, "YMC", "bugs"))],
    ]);

    // === YMC KPI ===
    addMergedSection(sheet, "YMC KPI", [
      ["Added Lines", getTotals("CD (Loc)", "deliverables"), ...releases.map(r => getValue(r, "CD (Loc)", "deliverables"))],
      [
        "Bug Density Internal (Bugs/1000 Lines)",
        (getTotals("IT(No of Test cases)", "bugs") / ((getTotals("CD (Loc)", "deliverables") || 1) / 1000)).toFixed(3),
        ...releases.map(r => (
          getValue(r, "IT(No of Test cases)", "bugs") /
          ((getValue(r, "CD (Loc)", "deliverables") || 1) / 1000)
        ).toFixed(3)),
      ],
      ["Bug Density UAT (Bugs/1000 Lines)", 0, ...new Array(releases.length).fill(0)],
    ]);

    // === TYPE OF ERROR ===
    addMergedSection(sheet, "Type of Error", [
      ["Requirement Understanding", getTotals("Requirement Understanding", "bugs"), ...releases.map(r => getValue(r, "System Test Requirement Bugs", "bugs"))],
      [
        "Testing Environment",
        getTotals("Testing Environment", "bugs"),
        ...(releases.map(r => getValue(r, "System Test UT Bugs", "bugs")).some(v => v !== undefined && v !== null)
          ? releases.map(r => getValue(r, "System Test UT Bugs", "bugs"))
          : releases.map(r => getValue(r, "System Test Integration Bugs", "bugs"))
        )
      ],

      ["Coding", getTotals("Coding", "bugs"), ...releases.map(r => getValue(r, "System Test Coding Bugs", "bugs"))],
      ["Designing", getTotals("Designing", "bugs"), ...releases.map(r => getValue(r, "System Test Design Bugs", "bugs"))],
    ]);

    // === INTERNAL TEST ===
    // === TEST CATEGORY (Merged Internal Test + UAT) ===
    addMergedSection(sheet, "Test Category", [
      ["Internal Test", "", ...new Array(releases.length).fill("")],

      ["Critical-Aaa", getTotals("Critical Bugs", "bugs"), ...releases.map(r => getValue(r, "Critical Bugs", "bugs"))],
      ["Major-Aa", getTotals("Major Bugs", "bugs"), ...releases.map(r => getValue(r, "Major Bugs", "bugs"))],
      ["Minor / Moderate-A", getTotals("Minor Bugs", "bugs"), ...releases.map(r => getValue(r, "Minor Bugs", "bugs"))],
      ["Low-B", getTotals("Low Bugs", "bugs"), ...releases.map(r => getValue(r, "Low Bugs", "bugs"))],

      ["", "", ...new Array(releases.length).fill("")],

      ["UAT", "", ...new Array(releases.length).fill("")],

      ["Critical-Aaa", getTotals("UAT Critical", "bugs"), ...releases.map(r => getValue(r, "UAT Critical", "bugs"))],
      ["Major-Aa", getTotals("UAT Major", "bugs"), ...releases.map(r => getValue(r, "UAT Major", "bugs"))],
      ["Minor / Moderate-A", getTotals("UAT Minor", "bugs"), ...releases.map(r => getValue(r, "UAT Minor", "bugs"))],
      ["Low-B", getTotals("UAT Low", "bugs"), ...releases.map(r => getValue(r, "UAT Low", "bugs"))],
    ]);


    // NOTE row (left side)
    const noteRow = sheet.addRow([
      "*NOTE",
      "Tracking new lines using SONAR have been considered after Splicing CR only. Therefore, N/A is mentioned in Added line columns.",
    ]);
    noteRow.getCell(1).font = { italic: true, color: { argb: "9C0006" } };
    noteRow.getCell(2).font = { italic: true, color: { argb: "9C0006" } };
    noteRow.eachCell((c) => {
      c.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      c.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    });

    sheet.getColumn(1).width = 28;
    sheet.getColumn(2).width = 28;
    for (let c = 3; c <= 3 + releases.length; c++) sheet.getColumn(c).width = 18;

    // return workbook (optional)
    return workbook;
  };

  /**
   * Adds a section with a vertically merged title in column A
   * and the provided rows beneath it.
   */
  const addMergedSection = (sheet, title, rows) => {
    // Start at next available row
    const startRow = (sheet.lastRow?.number || 0) + 1;

    // Add the data rows first
    rows.forEach((rowValues) => {
      sheet.addRow(["", ...rowValues]);
    });

    const endRow = startRow + rows.length - 1;

    // Merge title vertically in column A for this section
    sheet.mergeCells(`A${startRow}:A${endRow}`);

    // Apply the title to merged cell
    const titleCell = sheet.getCell(`A${startRow}`);
    titleCell.value = title;
    titleCell.font = { bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } };

    // Add borders for the section (A to last used column)
    const totalCols = sheet.getRow(startRow).cellCount;
    for (let r = startRow; r <= endRow; r++) {
      const row = sheet.getRow(r);
      const label = row.getCell(2).value; // "Critical-Aaa", "Major-Aa", etc.

      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);

        // Add borders
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        // Center alignment
        cell.alignment = { horizontal: "center", vertical: "middle" };

        // Highlight only the "Critical-Aaa" label and its data values (not total)
        if (label === "Critical-Aaa") {
          // Apply only from column D onward (skip A,B,C)
          if (c > 3) {

            // Red text
            cell.font = { color: { argb: "FF0000" }, bold: true };

            // Red background
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF5B7B7" } // light red background (not too dark)
            };
          }
        }

      }
    }


    // Add an empty row after each section for spacing
    sheet.addRow([]);
  };

  // Main function: Now includes Summary sheet generation
  const HandleMonthlyDownloadReport = async (year, month) => {
    try {
      setSyncLoading({
        active: true,
        text: `Generating ${month} ${year} Excel Report... Please wait`,
      });

      const workbook = createBaseWorkbook();
      const yearData = data?.[year];

      if (!yearData || !yearData[month]) {
        throw new Error(`No data found for ${month}, ${year}`);
      }

      const monthData = yearData[month];
      const monthEntries = Object.entries(monthData || {});
      if (monthEntries.length === 0) {
        throw new Error(`No project data found for ${month}, ${year}`);
      }

      // Add the Summary worksheet first
      await createWorkAnalysisWorkbook(workbook, year, month);

      // Loop through each project
      for (const [projectName, releasesOrArray] of monthEntries) {
        const projectReleases = [];

        if (Array.isArray(releasesOrArray)) {
          projectReleases.push({ release: null, rows: releasesOrArray });
        } else if (typeof releasesOrArray === "object" && releasesOrArray !== null) {
          Object.entries(releasesOrArray).forEach(([release, rows]) =>
            projectReleases.push({ release, rows: Array.isArray(rows) ? rows : [] })
          );
        } else {
          console.warn(`Skipping invalid project data for: ${projectName}`);
          continue;
        }

        // --- Consolidate totals ---
        const fieldTotals = {};
        let totalManDays = 0;
        let totalEfforts = 0;

        projectReleases.forEach(({ rows }) => {
          (rows || []).forEach((entry) => {
            if (!entry) return;
            const hasDeliverables = entry.hasOwnProperty("deliverables");
            const hasBugs = entry.hasOwnProperty("bugs");

            if (!hasDeliverables || !hasBugs) return;
            const row = entry.row || "Unknown";
            const deliverables = Number(entry.deliverables) || 0;
            const bugs = Number(entry.bugs) || 0;

            if (row === "Man Days") {
              totalManDays += deliverables;
              return;
            }
            if (row === "Engineering Efforts") {
              totalEfforts += deliverables;
              return;
            }

            if (!fieldTotals[row]) fieldTotals[row] = { deliverables: 0, bugs: 0 };
            fieldTotals[row].deliverables += deliverables;
            fieldTotals[row].bugs += bugs;
          });
        });

        // --- Create worksheet ---
        const projectSheet = workbook.addWorksheet(projectName, {
          views: [{ showGridLines: false }]
        });
        addHeaderSection(projectSheet, projectName, "", totalEfforts.toFixed(2), totalManDays, true);

        // --- Add data table ---
        const tableHeaders = ["Row", "Deliverables", "Bugs"];
        const tableRows = Object.entries(fieldTotals).map(([row, vals]) => [
          row,
          vals.deliverables,
          vals.bugs,
        ]);
        addStyledTable(projectSheet, tableHeaders, tableRows);
        autoFitColumns(projectSheet);

        // --- Add charts ---
        if (tableRows.length > 0) {
          await AddChartsToWorksheet(workbook, projectSheet, tableRows);
        }
      }

      // --- Save file ---
      const fileName = `Monthly_Report_${year}_${month}_Consolidated.xlsx`;
      await saveWorkbook(workbook, fileName);

      Swal.fire({
        icon: "success",
        title: "Excel Generated!",
        text: `${fileName} has been successfully created.`,
        confirmButtonColor: "#2dce89",
      });
    } catch (error) {
      console.error("Monthly Excel generation error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to generate Monthly Excel: " + error.message,
        confirmButtonColor: "#f5365c",
      });
    } finally {
      setSyncLoading({ active: false, text: "" });
    }
  };

  /**
   *  Handles full dashboard report download
   */
  const HandleDownloadReport = async () => {
    try {
      setSyncLoading({
        active: true,
        text: "Generating Excel Report... Please wait",
      });

      const element = props.mainPanelRef?.current;
      if (!element) throw new Error("Dashboard not rendered yet");

      // --- Extract header info ---
      const headerDiv = element.querySelector("div.d-flex.justify-content-between");
      const heading = headerDiv?.querySelector("h2")?.innerText || "Dashboard Report";
      const engineeringEffort = parseFloat(
        headerDiv?.querySelectorAll("span")[0]?.innerText?.split(":")[1]?.trim() || "0"
      );
      const manDays = parseFloat(
        headerDiv?.querySelectorAll("span")[1]?.innerText?.split(":")[1]?.trim() || "0"
      );

      // --- Extract table data ---
      const table = element.querySelector("table");
      if (!table) throw new Error("No table found in the dashboard");

      const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
        th.innerText.trim()
      );
      const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
        Array.from(row.querySelectorAll("td")).map((td) => td.innerText.trim())
      );

      if (rows.length === 0) throw new Error("No table data found to export");

      // --- Create workbook & worksheet ---
      const workbook = createBaseWorkbook();
      const worksheet = workbook.addWorksheet("KPI Report", {
        views: [{ showGridLines: false }]
      });
      worksheet.getColumn(1).width = 4;

      // --- Add header and table ---
      addHeaderSection(worksheet, heading, "", engineeringEffort, manDays, false);
      addStyledTable(worksheet, headers, rows);
      autoFitColumns(worksheet);

      // --- Add charts via renderChartImage() ---
      await AddChartsToWorksheet(workbook, worksheet, rows);

      // --- File name ---
      const match = heading.match(/^(.*? - RELEASE-\d+\.\d+)/);
      const releaseName = match ? match[1].trim() : heading;
      const cleanReleaseName = releaseName.replace(/[^a-zA-Z0-9\-_. ]/g, "_");
      const fileName = `${cleanReleaseName}KPI_Report_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      await saveWorkbook(workbook, fileName);

      Swal.fire({
        icon: "success",
        title: "Excel Generated!",
        text: `${fileName} has been successfully created.`,
        confirmButtonColor: "#2dce89",
      });
    } catch (error) {
      console.error("Excel generation error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to generate Excel: " + error.message,
        confirmButtonColor: "#f5365c",
      });
    } finally {
      setSyncLoading({ active: false, text: "" });
    }
  };

  return (
    <>
      {/* Global Loader */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <Spinner style={{ width: "3rem", height: "3rem" }} color="light" />
          <div
            style={{
              marginTop: "20px",
              color: "#fff",
              fontSize: "2rem",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Loading Data... Please Wait
          </div>
        </div>
      )}

      {/* Full-Page Loader for Sync */}
      {syncLoading.active && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <Spinner style={{ width: "3rem", height: "3rem" }} color="light" />
          <div
            style={{
              marginTop: "20px",
              color: "#fff",
              fontSize: "2rem",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {syncLoading.text}
          </div>
        </div>
      )}
    <Navbar className={classNames("navbar-absolute", color)} expand="lg">
      <Container fluid style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="navbar-wrapper" style={{ 
          display: "flex", 
          alignItems: "center", 
          flex: "0 0 auto",
          minWidth: "0"
        }}>
          {/* Hamburger Menu Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Hamburger clicked, toggleSidebar function:", typeof props.toggleSidebar);
              if (props.toggleSidebar) {
                props.toggleSidebar();
              } else {
                console.error("toggleSidebar function not found in props");
              }
            }}
            style={{
              background: "#1d8cf8",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px 15px",
              borderRadius: "4px",
              marginRight: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              flexShrink: 0,
              height: "40px",
              zIndex: 9999
            }}
            title="Toggle Sidebar"
          >
            ☰
          </button>
          <NavbarBrand
            href="#pablo"
            onClick={e => e.preventDefault()}
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              margin: "0",
              padding: "0",
              whiteSpace: "nowrap",
              position: "relative"
            }}
          >
            {props.brandText}
          </NavbarBrand>
        </div>

        <NavbarToggler onClick={toggleCollapse}>
          <span className="navbar-toggler-bar navbar-kebab" />
          <span className="navbar-toggler-bar navbar-kebab" />
          <span className="navbar-toggler-bar navbar-kebab" />
        </NavbarToggler>

        <Collapse navbar isOpen={collapseOpen}>
          <Nav className="ml-auto" navbar>
            {/* MOBILE: TEXT BUTTONS ONLY */}
            {isMobileView ? (
              <>
                <NavItem>
                  <Button color="link" onClick={syncAllData}>
                    Sync All Data
                  </Button>
                </NavItem>
                <NavItem>
                  <Button color="link" onClick={syncCurrentMonth}>
                    Sync Current Month
                  </Button>
                </NavItem>
              </>
            ) : (
              <>
                {/* DESKTOP: ICON BUTTONS WITH TOOLTIP */}
                <NavItem className="d-flex align-items-center mx-1 p-0 pb-2">
                  <UncontrolledTooltip delay={0} placement="bottom" target="syncAllBtn">
                    Sync All Data
                  </UncontrolledTooltip>
                  <Button
                    id="syncAllBtn"
                    className="btn-icon btn-round"
                    style={{
                      background: "linear-gradient(135deg, #1d8cf8 0%, #1171ef 100%)",
                      border: "none",
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                    }}
                    onClick={syncAllData}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <i className="tim-icons icon-refresh-01" style={{ fontSize: "16px" }} />
                  </Button>
                </NavItem>

                <NavItem className="d-flex align-items-center mx-1 p-0 pb-2">
                  <UncontrolledTooltip delay={0} placement="bottom" target="syncMonthBtn">
                    Sync Current Month
                  </UncontrolledTooltip>
                  <Button
                    id="syncMonthBtn"
                    className="btn-icon btn-round"
                    style={{
                      background: "linear-gradient(135deg, #00f2c3 0%, #0098f0 100%)",
                      border: "none",
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                    }}
                    onClick={syncCurrentMonth}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <i className="tim-icons icon-calendar-60" style={{ fontSize: "16px" }} />
                  </Button>
                </NavItem>
                <NavItem className="separator d-lg-none" />

                {/* User Profile and Logout */}
                {userInfo && (
                  <>
                    <NavItem className="d-flex align-items-center p-0 pb-2">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "0 8px",
                          color: theme === themes.light ? "#2E3A59" : "#fff",
                        }}
                      >
                        <i 
                          className="tim-icons icon-single-02" 
                          style={{ 
                            fontSize: "18px",
                            color: theme === themes.light ? "#5B6B8C" : "#fff"
                          }} 
                        />
                        <span style={{ fontSize: "14px", fontWeight: "500" }}>
                          {userInfo.name || userInfo.email}
                        </span>
                      </div>
                    </NavItem>
                    <NavItem className="d-flex align-items-center mx-1 p-0 pb-2">
                      <Button
                        className="btn-icon btn-round"
                        style={{
                          background: "linear-gradient(135deg, #fd5d93 0%, #ec250d 100%)",
                          border: "none",
                          color: "#fff",
                          width: "40px",
                          height: "40px",
                          padding: "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                        }}
                        onClick={handleLogout}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <i className="tim-icons icon-button-power" style={{ fontSize: "16px" }} />
                      </Button>
                    </NavItem>
                  </>
                )}
              </>
            )}
          </Nav>
        </Collapse>
      </Container>
    </Navbar>
      {/* Search Modal */}
      <Modal
        modalClassName="modal-search"
        isOpen={modalSearch}
        toggle={toggleModalSearch}
      >
        <ModalHeader toggle={toggleModalSearch}>
          <Input placeholder="SEARCH" type="text" />
        </ModalHeader>
      </Modal>
    </>
  );
}

export default AdminNavbar;
