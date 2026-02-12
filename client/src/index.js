/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: Index
* Description
* -----------------------------------------------------------------------------------
* Main landing for loading react components dom and root.
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
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./config/msalConfig";

import AdminLayout from "layouts/Admin/Admin.js";
import Login from "views/Login.js";

import "assets/scss/black-dashboard-react.scss";
import "assets/demo/demo.css";
import "assets/css/nucleo-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import ThemeContextWrapper from "./components/ThemeWrapper/ThemeWrapper";
import BackgroundColorWrapper from "./components/BackgroundColorWrapper/BackgroundColorWrapper";
import { GlobalProvider } from "contexts/GlobalContext";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL before rendering
msalInstance.initialize().then(() => {
  const root = ReactDOM.createRoot(document.getElementById("root"));

  root.render(
    <MsalProvider instance={msalInstance}>
      <ThemeContextWrapper>
        <BackgroundColorWrapper>
          <BrowserRouter>
          <GlobalProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/*" element={<AdminLayout />} />
              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />
            </Routes>
            </GlobalProvider>
          </BrowserRouter>
        </BackgroundColorWrapper>
      </ThemeContextWrapper>
    </MsalProvider>
  );
});
