import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Galaxy from "./Galaxy";
function App() {
  return (
    <Router>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Galaxy />} />
      </Routes>
    </Router>
  );
}
export default App;
