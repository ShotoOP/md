import React from "react";
import "./Preloader.css";

function Preloader() {
  return (
    <div className="preloader-container">
      <div className="coin-loader">
        <div className="coin">
          <span className="coin-text">mindstocs</span>
        </div>
        <div className="coin">
          <span className="coin-text">mindstocs</span>
        </div>
        <div className="coin">
          <span className="coin-text">mindstocs</span>
        </div>
      </div>
    </div>
  );
}

export default Preloader;
