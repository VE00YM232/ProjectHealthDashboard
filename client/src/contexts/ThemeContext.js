/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: context
* Description
* -----------------------------------------------------------------------------------
* Theme context for light and dark theme for component
*
* -----------------------------------------------------------------------------------
*
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/
import { createContext } from "react";

export const themes = {
  dark: "",
  light: "white-content",
};

export const ThemeContext = createContext({
  theme: themes.dark,
  changeTheme: () => {},
});
