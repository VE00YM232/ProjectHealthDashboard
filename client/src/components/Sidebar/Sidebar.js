/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: components sidebar
* Description
* -----------------------------------------------------------------------------------
* Contains components for sidebar screen
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import { Nav, Collapse } from "reactstrap";
import { BackgroundColorContext } from "contexts/BackgroundColorContext";
import { useGlobalData } from "contexts/GlobalContext"; // import data
import { ThemeContext, themes } from "contexts/ThemeContext";
import "assets/css/Sidebar.css";

function Sidebar({ onMouseLeave, toggleSidebar }) {
  const { data } = useGlobalData(); // get full KPI data
  const { theme } = useContext(ThemeContext);
  const [openYear, setOpenYear] = useState(null);
  const [openMonth, setOpenMonth] = useState({});
  const [openProject, setOpenProject] = useState({});

  const toggleYear = (year) => {
    setOpenYear(openYear === year ? null : year);
    setOpenMonth({});
    setOpenProject({});
  };

  const toggleMonth = (year, month) => {
    setOpenMonth((prev) => ({
      ...prev,
      [year]: prev[year] === month ? null : month,
    }));
    setOpenProject({});
  };

  const toggleProject = (year, month, project) => {
    const key = `${year}-${month}`;
    setOpenProject((prev) => ({
      ...prev,
      [key]: prev[key] === project ? null : project,
    }));
  };

  return (
    <BackgroundColorContext.Consumer>
      {({ color }) => (
        <div className="sidebar" data={color} style={{ background: theme === themes.light ? "#F4F6FA" : "#1C2233", borderRight: theme === themes.light ? "1px solid #E1E6EF" : "none" }}>
          <div className="sidebar-wrapper" style={{ background: theme === themes.light ? "#F4F6FA" : "#1C2233" }}>
            {/* Close Button */}
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              padding: "10px 20px",
              borderBottom: theme === themes.light ? "1px solid #E1E6EF" : "1px solid #2A3148"
            }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Close button clicked, toggleSidebar function:", typeof toggleSidebar);
                  if (toggleSidebar) {
                    toggleSidebar();
                  } else {
                    console.error("toggleSidebar function not found in Sidebar props");
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "5px 12px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  fontWeight: "bold",
                  color: theme === themes.light ? "#000000" : "#FFFFFF"
                }}
                title="Close Sidebar"
              >
                ✕
              </button>
            </div>
            <Nav>
              {Object.entries(data)
                .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
                .map(([year, monthsObj]) => (
                <li key={year} className="nav-item">
                  {/* Year */}
                  <div
                    className="nav-link year-link d-flex align-items-center cursor-pointer"
                    onClick={() => toggleYear(year)}
                  >
                    <i className="tim-icons icon-calendar-60 mr-2" style={{ color: theme === themes.light ? "#5B6B8C" : "" }} />
                    <p className="mb-0 flex-grow-1">{year}</p>
                    <span className="arrow">
                      {openYear === year ? "▼" : "▶"}
                    </span>
                  </div>

                  <Collapse isOpen={openYear === year}>
                    {Object.entries(monthsObj)
                      .sort(([monthA], [monthB]) => {
                        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
                      })
                      .map(([month, projectsObj]) => {
                      const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;
                      return (
                      <div key={month} className="pl-3">
                         <NavLink
                          to={`/admin/${year}/${month}`}
                          className="nav-link month-link d-flex align-items-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent collapsing when navigating
                            toggleMonth(year, month);
                          }}
                        >
                          <span className="month-calendar-icon mr-2" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#1d8cf8',
                            borderRadius: '6px',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            color: '#ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}>
                            {monthNumber}
                          </span>
                          <p className="mb-0 flex-grow-1">{month}</p>
                          <span className="arrow">
                            {openMonth[year] === month ? "▼" : "▶"}
                          </span>
                        </NavLink>

                        <Collapse
                          isOpen={openMonth[year] === month}
                        >
                          {/* Projects */}
                          {Object.entries(projectsObj).map(([project, releases]) => (
                            <div key={project} className="pl-4">
                              <NavLink
                                to={`/admin/${year}/${month}/${project}`}
                                className="nav-link project-link d-flex align-items-center cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProject(year, month, project);
                                }}
                              >
                                <p className="mb-0 flex-grow-1">{project}</p>
                                <span className="arrow">
                                  {openProject[`${year}-${month}`] === project ? "▼" : "▶"}
                                </span>
                              </NavLink>

                              <Collapse
                                isOpen={openProject[`${year}-${month}`] === project}
                              >
                                {/* Releases */}
                                {Array.isArray(releases)
                                  ? [] // some months may have direct array for KPI rows (no release)
                                  : Object.keys(releases).map((release) => (
                                    <NavLink
                                      key={release}
                                      to="dashboard"
                                      state={{
                                        year,
                                        month,
                                        project,
                                        release,
                                      }}
                                      className="nav-link release-link pl-5"
                                    >
                                      <p className="mb-0">{release}</p>
                                    </NavLink>
                                  ))}
                              </Collapse>
                            </div>
                          ))}
                        </Collapse>
                      </div>
                      );
                    })}
                  </Collapse>
                </li>
              ))}
            </Nav>
          </div>
        </div>
      )}
    </BackgroundColorContext.Consumer>
  );
}

export default Sidebar;
