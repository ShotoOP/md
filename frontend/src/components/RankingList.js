import React, { useState, useEffect } from "react";
import "./RankingList.css"; // Ensure you have the correct styles
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const rankIcons = [
  "bi-award",
  "bi-award-fill",
  "bi-trophy",
  "bi-shield-lock",
  "bi-gem",
  "bi-trophy-fill",
  "bi-stars",
  "bi-patch-check",
  "bi-lightning-fill",
  "bi-flag",
  "bi-rocket-takeoff",
  "bi-emoji-sunglasses",
  "bi-emoji-smile",
  "bi-person-badge",
  "bi-lightbulb",
];

const RankingList = () => {
  const totalBars = 15;
  const visibleBars = 5;
  const intervalTime = 2000; // Time interval in milliseconds

  const [startIndex, setStartIndex] = useState(0);
  const progressValues = [
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 45, 55, 65, 75, 85,
  ];
  const rankNames = [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Elite",
    "Pro",
    "Master",
    "Grandmaster",
    "Legend",
    "Novice",
    "Apprentice",
    "Expert",
    "Champion",
    "Supreme",
  ];
  const investmentValues = [
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 450, 550, 650, 750, 850,
  ];
  const returnValues = investmentValues.map((value) => value * 1.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setStartIndex((prevIndex) => (prevIndex + 1) % totalBars);
    }, intervalTime);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-75 p-3 rounded overflow-hidden">
      {Array.from({ length: visibleBars }).map((_, index) => {
        const currentIndex = (startIndex + index) % totalBars;
        return (
          <div
            key={currentIndex}
            className="d-flex align-items-center mb-2 bar-container"
            style={{ height: "40px" }}
          >
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`tooltip-button-${currentIndex}`}>
                  {rankNames[currentIndex]} - Investment: $
                  {investmentValues[currentIndex]}
                </Tooltip>
              }
            >
              <button
                className="btn btn-warning me-2 bar-button d-flex align-items-center"
                style={{ width: "150px", height: "100%" }}
              >
                <i className={`bi ${rankIcons[currentIndex]} me-2`}></i>
                {rankNames[currentIndex]}
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`tooltip-progress-${currentIndex}`}>
                  {progressValues[currentIndex]}% - Return: $
                  {returnValues[currentIndex]}
                </Tooltip>
              }
            >
              <div
                className="progress bar-progress"
                style={{ height: "100%", width: "calc(100% - 170px)" }}
              >
                <div
                  className="progress-bar bg-warning bar-progress-bar"
                  role="progressbar"
                  style={{ width: `${progressValues[currentIndex]}%`}}
                  aria-valuenow={progressValues[currentIndex]}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </OverlayTrigger>
          </div>
        );
      })}
    </div>
  );
};

export default RankingList;
