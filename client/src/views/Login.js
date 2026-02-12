/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
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
* Divjyot Singh        Sep 22, 2025        Initial Creation
* -----------------------------------------------------------------------------------
*/
import React, { useState, useContext } from "react";
import { BackgroundColorContext, backgroundColors } from "../contexts/BackgroundColorContext";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/msalConfig";
import {
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Row,
    Col,
    Alert
} from "reactstrap";

function Login() {
    const { color, changeColor } = useContext(BackgroundColorContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const { instance } = useMsal();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }
        const loginStatus = await fetch("/checkLogin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        if (loginStatus.status !== 200) {
            setError("Invalid username or password.");
            return;
        }
        setError("");
        navigate("/admin/dashboard");
    };

    const handleMicrosoftLogin = async () => {
        console.log("Microsoft login button clicked");
        console.log("MSAL Instance:", instance);
        
        try {
            setError("");
            
            console.log("Attempting popup login...");
            const loginResponse = await instance.loginPopup({
                scopes: ["User.Read", "openid", "profile", "email"],
                prompt: "select_account", // Always show account picker
            });
            
            console.log("Login successful:", loginResponse);
            
            // Store user info in session storage
            if (loginResponse.account) {
                const userInfo = {
                    name: loginResponse.account.name,
                    email: loginResponse.account.username,
                };
                
                console.log("User info:", userInfo);
                sessionStorage.setItem('msalUser', JSON.stringify(userInfo));
                
                // Sync session with server
                try {
                    const sessionResponse = await fetch("/auth/session", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include",
                        body: JSON.stringify(userInfo)
                    });
                    console.log("Session sync response:", sessionResponse.status);
                } catch (err) {
                    console.warn("Failed to sync session with server:", err);
                }
            }
            
            navigate("/admin/dashboard");
        } catch (error) {
            console.error("SSO Login Error:", error);
            console.error("Error Code:", error.errorCode);
            console.error("Error Message:", error.errorMessage);
            
            // Provide detailed error messages
            if (error.errorCode === "invalid_client") {
                setError("Azure AD app configuration error. Please check the app registration settings.");
            } else if (error.errorCode === "interaction_in_progress") {
                setError("Authentication is already in progress. Please close any open popups.");
            } else if (error.errorCode === "user_cancelled") {
                setError("Login was cancelled.");
            } else if (error.errorCode === "popup_window_error") {
                setError("Popup was blocked by browser. Please enable popups for this site.");
            } else {
                setError(`Microsoft SSO login failed: ${error.errorMessage || error.message || "Please try again."}`);
            }
        }
    };

    // Map context color to Bootstrap color classes
    const colorClassMap = {
        primary: "primary",
        blue: "info",
        green: "success"
    };
    const selectedColorClass = colorClassMap[color] || "primary";

    return (
        <>
            <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <Row className="w-100 justify-content-center align-items-center">
                <Col xs="12" md="6" lg="5" xl="4">
                    <Card className="shadow-lg">
                        <CardHeader className="pb-0">
                            <CardTitle tag="h4" className="mb-1 text-center">Sign In</CardTitle>
                            <p className="text-muted mb-3 text-center" style={{ fontSize: "0.875rem" }}>
                                Enter your credentials to access the KPI Dashboard
                            </p>
                        </CardHeader>
                        
                        <CardBody>
                            {error && (
                                <Alert color="danger" className="d-flex align-items-center">
                                    <i className="nc-icon nc-simple-remove me-2"></i>
                                    {error}
                                </Alert>
                            )}
                            
                            <Form onSubmit={handleSubmit} autoComplete="off">
                                <FormGroup>
                                    <Label for="username" className="fw-semibold">
                                        Username <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="form-control"
                                        style={{ padding: "0.625rem 0.75rem" }}
                                    />
                                </FormGroup>
                                
                                <FormGroup>
                                    <Label for="password" className="fw-semibold">
                                        Password <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="form-control"
                                        style={{ padding: "0.625rem 0.75rem" }}
                                    />
                                </FormGroup>

                                <FormGroup className="d-flex justify-content-between align-items-center mb-4">
                                    <div className="form-check">
                                        <Input
                                            type="checkbox"
                                            id="rememberMe"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="form-check-input"
                                        />
                                        <Label for="rememberMe" className="form-check-label mb-0" style={{ fontSize: "0.875rem" }}>
                                            Remember me
                                        </Label>
                                    </div>
                                    <a href="#forgot" className="text-white text-decoration-none fs-6">
                                        Forgot password?
                                    </a>
                                </FormGroup>

                                <Button 
                                    color={selectedColorClass}
                                    type="submit" 
                                    block 
                                    className="fw-semibold"
                                    style={{ padding: "0.75rem" }}
                                >
                                    Sign In
                                </Button>

                                <div className="text-center my-3">
                                    <span className="text-muted">OR</span>
                                </div>

                                <Button 
                                    color="light"
                                    type="button"
                                    block 
                                    className="fw-semibold d-flex align-items-center justify-content-center"
                                    style={{ padding: "0.75rem", backgroundColor: "#fff", color: "#5e5e5e", border: "1px solid #8898aa" }}
                                    onClick={handleMicrosoftLogin}
                                >
                                    <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "10px" }}>
                                        <path d="M11 11H0V0H11V11Z" fill="#F25022"/>
                                        <path d="M23 11H12V0H23V11Z" fill="#7FBA00"/>
                                        <path d="M11 23H0V12H11V23Z" fill="#00A4EF"/>
                                        <path d="M23 23H12V12H23V23Z" fill="#FFB900"/>
                                    </svg>
                                    Sign in with Microsoft
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>

                {/* Info Panel */}
                <Col xs="12" md="6" lg="5" xl="4" className="d-none d-md-block">
                    <Card className={`bg-${selectedColorClass} text-white`} style={{ minHeight: "400px" }}>
                        <CardBody className="d-flex flex-column justify-content-center p-4">
                            <div className="mb-4">
                                <i className="nc-icon nc-chart-bar-32" style={{ fontSize: "3rem" }}></i>
                            </div>
                            <h3 className="mb-3">KPI Dashboard</h3>
                            <p style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                                Track and analyze your key performance indicators with real-time data visualization and comprehensive reporting tools.
                            </p>
                            <ul className="mt-3" style={{ fontSize: "0.875rem", listStyleType: "none", paddingLeft: "0" }}>
                                <li className="mb-2">
                                    <i className="nc-icon nc-check-2 me-2"></i>
                                    Real-time analytics and metrics
                                </li>
                                <li className="mb-2">
                                    <i className="nc-icon nc-check-2 me-2"></i>
                                    Interactive data visualizations
                                </li>
                                <li className="mb-2">
                                    <i className="nc-icon nc-check-2 me-2"></i>
                                    Comprehensive project tracking
                                </li>
                                <li>
                                    <i className="nc-icon nc-check-2 me-2"></i>
                                    Detailed performance reports
                                </li>
                            </ul>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
        </>
    );
}

export default Login;
