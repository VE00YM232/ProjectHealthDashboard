/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: layout
* Description
* -----------------------------------------------------------------------------------
* Contains pageLayout component for the navigation
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

// core components
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Footer from "components/Footer/Footer.js";
import Sidebar from "components/Sidebar/Sidebar.js";

import routes from "routes.js";

import logo from "assets/img/react-logo.png";
import { BackgroundColorContext } from "contexts/BackgroundColorContext";
import Dashboard from "views/Dashboard";
import MonthDashboard from "views/MonthDashboard";
import ProjectDashboard from "views/ProjectDashboard";

var ps;

function Admin(props) {
  const location = useLocation();
  const mainPanelRef = React.useRef(null);
  const [sidebarOpened, setsidebarOpened] = React.useState(false);

  React.useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    htmlElement.style.overflow = 'hidden';
    htmlElement.style.height = '100vh';
    bodyElement.style.overflow = 'hidden';
    bodyElement.style.height = '100vh';
    bodyElement.style.position = 'fixed';
    bodyElement.style.width = '100%';

    // Add non-passive wheel event listener
    const handleWheel = (e) => {
      const element = mainPanelRef.current;
      if (!element) return;
      
      const atTop = element.scrollTop === 0;
      const atBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;
      
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    };

    const mainPanel = mainPanelRef.current;
    if (mainPanel) {
      mainPanel.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      htmlElement.style.overflow = '';
      htmlElement.style.height = '';
      bodyElement.style.overflow = '';
      bodyElement.style.height = '';
      bodyElement.style.position = '';
      bodyElement.style.width = '';
      
      if (mainPanel) {
        mainPanel.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  React.useEffect(() => {
    if (mainPanelRef.current) {
      mainPanelRef.current.scrollTop = 0;
    }
  }, [location]);

  const toggleSidebar = () => {
    console.log("Toggle sidebar clicked, current state:", sidebarOpened);
    document.documentElement.classList.toggle("nav-open");
    setsidebarOpened(!sidebarOpened);
    console.log("Sidebar toggled to:", !sidebarOpened);
  };

  return (
    <BackgroundColorContext.Consumer>
      {({ color, changeColor }) => (
        <React.Fragment>
          <div 
            className="wrapper" 
            style={{ 
              height: '100vh', 
              width: '100vw',
              overflow: 'hidden',
              position: 'fixed',
              top: 0,
              left: 0
            }}
          >
            <Sidebar
              routes={routes}
              logo={{
                outterLink: "",
                text: "Year Wise Releases",
                imgSrc: logo,
              }}
              toggleSidebar={toggleSidebar}
            />
            <div 
              className="main-panel" 
              ref={mainPanelRef} 
              data={color}
              style={{ 
                height: '100vh', 
                overflowY: 'auto', 
                overflowX: 'hidden',
                position: 'relative',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <AdminNavbar
                brandText="PROJECT HEALTH DASHBOARD"
                toggleSidebar={toggleSidebar}
                sidebarOpened={sidebarOpened}
                mainPanelRef={mainPanelRef}
              />
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path=":year/:month/:project" element={<ProjectDashboard />} />
              </Routes>
              {location.pathname === "/admin/maps" ? null : <Footer fluid />}
            </div>
          </div>
        </React.Fragment>
      )}
    </BackgroundColorContext.Consumer>
  );
}

export default Admin;
