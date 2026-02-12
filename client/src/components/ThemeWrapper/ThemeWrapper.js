/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: component theme wrapper
* Description
* -----------------------------------------------------------------------------------
* Component for theme
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React, { useState, useEffect } from "react";
import { ThemeContext, themes } from "contexts/ThemeContext";

export default function ThemeContextWrapper(props) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" ? themes.light : themes.dark;
  });

  function changeTheme(theme) {
    setTheme(theme);
    localStorage.setItem("theme", theme === themes.light ? "light" : "dark");
  }

  useEffect(() => {
    switch (theme) {
      case themes.light:
        document.body.classList.add("white-content");
        break;
      case themes.dark:
      default:
        document.body.classList.remove("white-content");
        break;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme: theme, changeTheme: changeTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}
