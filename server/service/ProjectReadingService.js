/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: Project Hierarchy Service
* Description
* -----------------------------------------------------------------------------------
* Provides service related to Project structure and release hierarchy
* 
* -----------------------------------------------------------------------------------
* 
* Revision History
* -----------------------------------------------------------------------------------
* Modified By          Modified On         Description
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/

const fs = require("fs");
const path = require("path");

const ReleaseFolderService = {
    /**
     * Function to get all the information about the release hierarchy
     * @param {*} baseDir Directory where the year folders are present
     */
    GetReleaseHierarchy: (baseDir) => {
        const result = [];

        if (!fs.existsSync(baseDir)) {
            throw new Error(`Base directory not found: ${baseDir}`);
        }

        // Loop through year folders
        const years = fs.readdirSync(baseDir).filter((file) => {
            return fs.statSync(path.join(baseDir, file)).isDirectory();
        });

        years.forEach((year) => {
            const yearPath = path.join(baseDir, year);
            const months = fs.readdirSync(yearPath).filter((file) =>
                fs.statSync(path.join(yearPath, file)).isDirectory()
            );

            const monthData = months.map((month) => {
                const monthPath = path.join(yearPath, month);
                const projects = fs.readdirSync(monthPath).filter((file) =>
                    fs.statSync(path.join(monthPath, file)).isDirectory()
                );

                const projectData = projects.map((project) => {
                    const projectPath = path.join(monthPath, project);
                    const releases = fs.readdirSync(projectPath).filter((file) =>
                        fs.statSync(path.join(projectPath, file)).isDirectory()
                    );

                    return {
                        project,
                        releases
                    };
                });

                return {
                    month,
                    projects: projectData
                };
            });

            result.push({
                year,
                months: monthData
            });
        });

        return result;
    },

    /**
     * Function to Find the releases of a particular month of a year
     * @param {*} baseDir Directory where the year folders are present
     * @param {*} year The year to search
     * @param {*} month The Month to search
     */
    GetReleaseHierarchyByMonth: (baseDir, year, month) => {
        const yearPath = path.join(baseDir, year.toString());
        if (!fs.existsSync(yearPath)) {
            throw new Error(`Year folder not found: ${year}`);
        }

        const monthPath = path.join(yearPath, month.toString());
        if (!fs.existsSync(monthPath)) {
            throw new Error(`Month folder not found: ${month} in year ${year}`);
        }

        const projects = fs.readdirSync(monthPath).filter((file) =>
            fs.statSync(path.join(monthPath, file)).isDirectory()
        );

        const projectData = projects.map((project) => {
            const projectPath = path.join(monthPath, project);
            const releases = fs.readdirSync(projectPath).filter((file) =>
                fs.statSync(path.join(projectPath, file)).isDirectory()
            );

            return {
                project,
                releases
            };
        });

        return {
            year,
            month,
            projects: projectData
        };
    },

    /**
     * FUnction to get the excel files for a particular release
     * @param {*} baseDir Directory where the year folders are present
     * @param {*} year year of the release
     * @param {*} month month of the release
     * @param {*} project project name
     * @param {*} releaseName name of the release
     */
    GetExcelFilesByRelease: (baseDir, year, month, project, releaseName) => {
        const releasePath = path.join(
            baseDir,
            year.toString(),
            month.toString(),
            project,
            releaseName
        );

        if (!fs.existsSync(releasePath)) {
            throw new Error(
                `Release folder not found: ${releaseName} (Project: ${project}, Month: ${month}, Year: ${year})`
            );
            return false;
        }

        const result = {
            DLS: null,
            TestReport: null,
        };

        const excelFiles = fs
            .readdirSync(releasePath)
            .filter(
                (file) =>
                    file.toLowerCase().endsWith(".xlsx") || file.toLowerCase().endsWith(".xls")
            )
            .map((file) => path.join(releasePath, file));


        excelFiles.forEach((file) => {
            const lower = path.basename(file).toLowerCase();
            if (lower.includes("dls")) {
                result.DLS = file;
            } else if (lower.includes("test")) {
                result.TestReport = file;
            }
            else if (lower.includes("estimation")) {
                result.Estimation = file;
            }
        });

        return result;
    }

};

module.exports = ReleaseFolderService;
