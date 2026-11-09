// src/Pages/Home/Loading.js
import React from "react";
import "../../App.css";

const Loading = ({ isVisible }) => {
  return (
    <div className={`loading-screen ${isVisible ? "visible" : "hidden"}`}>
      <h1 className="loading-text">
        <span className="name-text">Daniel Brambila</span>
        <span className="portfolio-text"> Portfolio</span>
      </h1>
    </div>
  );
};

export default Loading;