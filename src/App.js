import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Galaxy from "./Galaxy";
import Navbar from "./Navbar";

function App() {
  return (
    <Router>
      {/* <Navbar /> */}
      <Routes>
        <Route
          path="/"
          element={
            <Galaxy>
              <SpeedInsights />
            </Galaxy>
          }
        />
      </Routes>
    </Router>
  );
}
export default App;
