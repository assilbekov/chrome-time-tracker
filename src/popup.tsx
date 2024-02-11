import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const [trackedTime, setTrackedTime] = useState<TimeSpentOnDomains>({});
  const timesToShow = useMemo(() => {
    const trackedTimeArray = Object.
      entries(trackedTime).
      filter(([_, time]) => time > 0).
      map(([domain, time]) => ({ domain, time }));
    trackedTimeArray.sort((a, b) => b.time - a.time);
    return trackedTimeArray;
  }, [trackedTime]);

  useEffect(() => {
    chrome.storage.local.get("timeSpentOnDomains", (result) => {
      setTrackedTime(JSON.parse(result.timeSpentOnDomains) || {});
    });
  }, []);

  const handleStartTracking = () => {
    chrome.runtime.sendMessage({ action: "startTracking" }, (response) => {
      console.log('Tracking started');
    });
  }

  const handleStopTracking = () => {
    chrome.runtime.sendMessage({ action: "stopTracking" }, (response) => {
      console.log('Tracking stopped');
    });
  }

  const handleResetTracking = () => {
    chrome.runtime.sendMessage({ action: "resetTracking" }, (response) => {
      console.log('Tracking reseted');
    });
  };

  return (
    <div style={{ width: "400px" }}>
      <div style={{ padding: "12px 16px" }}>
        <h1>Time spent on domains</h1>
        <p
          style={{
            color: "#676c71",
            lineHeight: 1.5,
            marginTop: "8px",
            paddingLeft: "4px",
            fontSize: ".75rem",
          }}
        >
          We currently save only 24 hours history. Please click start button to start tracking visiting domains. Stop button to stop tracking. Reset button to reset the tracking data.
        </p>
      </div>
      <div style={{ display: "flex", gap: "8px", padding: "0 24px" }}>
        <button className="button button-primary" onClick={handleStartTracking}>start</button>
        <button className="button button-secondary" onClick={handleStopTracking}>stop</button>
        <button className="button button-outlined" onClick={handleResetTracking}>reset</button>
      </div>
      {timesToShow.length ? (
        <ul style={{ padding: "12px 24px", marginTop: "12px" }}>
          {timesToShow.map(time => (
            <li
              key={time.domain}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                lineHeight: 1.5,
                listStyle: "none",
                padding: "10px 16px",
                borderBottom: "1px solid #f1f1f1",
                boxShadow: `rgba(99, 99, 99, 0.2) 0px 2px 8px 0px`,
                marginBottom: "10px",
              }}
            >
              <span>{time.domain}</span>
              <span>{new Date(time.time).toISOString().slice(11, 19)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            color: "#676c71",
            fontWeight: 600,
            padding: "12px 24px",
            fontSize: ".875rem",
          }}
        >
          No time tracked. Please click start button to start tracking visiting domains.
        </p>
      )}
    </div>
  )
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);