/**
* Project Name : KPI Dashboard
* @company YMSLI
* @author  Divjyot Singh
* @date    Sep 22, 2025
* Copyright (c) 2025, Yamaha Motor Solutions (INDIA) Pvt Ltd.
* Module: component footer
* Description
* -----------------------------------------------------------------------------------
* Component for footer
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
import { useGlobalData } from "../../contexts/GlobalContext";

// reactstrap components
import { Container } from "reactstrap";

function Footer() {
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data } = useGlobalData();

  useEffect(() => {
    fetchLastSyncTime();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchLastSyncTime();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh sync time when data changes (after sync)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      fetchLastSyncTime();
    }
  }, [data]);

  const fetchLastSyncTime = async () => {
    try {
      const response = await fetch('/getLastSyncTime');
      const data = await response.json();
      
      if (data.message === 'success' && data.lastSyncTime) {
        setLastSyncTime(data.lastSyncTime);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching last sync time:', error);
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  };

  return (
    <footer className="footer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '0', padding: '0' }}>
      <Container fluid style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="copyright" style={{ color: '#9A9A9A', textAlign: 'center' }}>
          {loading ? (
            'Loading sync information...'
          ) : (
            <h4>
              Last data sync: <strong>{formatDateTime(lastSyncTime)}</strong>
            </h4>
          )}
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
