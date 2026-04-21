import { BrowserRouter, Routes, Route } from "react-router-dom";

import Upload from "../pages/Upload";
import Stats from "../pages/Stats";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/stats" element={<Stats/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
