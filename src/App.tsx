import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import type { ValidFile } from "./types";

import Home from "./Home";
import Table from "./Table";

function App() {
  const [files, setFiles] = useState<ValidFile[]>([]);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home files={files} setFiles={setFiles}/>} />
        <Route path="/table" element={<Table files={files}/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
