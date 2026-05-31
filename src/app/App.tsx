import { BrowserRouter, Routes, Route } from "react-router-dom";

import Upload from "../pages/Upload";
import Stats from "../pages/Stats";
import Callback from "../pages/Callback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload/>} />
        <Route path="/stats" element={<Stats/>} />
        <Route path="/callback" element={<Callback/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
