import { BrowserRouter, Routes, Route } from "react-router-dom";

import Upload from "../pages/Upload";
import Stats from "../pages/Stats";
import Callback from "../pages/Callback";
import Home from "../pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/upload" element={<Upload/>} />
        <Route path="/stats" element={<Stats/>} />
        <Route path="/callback" element={<Callback/>} />
        <Route path="/" element={<Home/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
