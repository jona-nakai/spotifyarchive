import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Home from "./Home";
import Table from "./Table";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/table" element={<Table/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
