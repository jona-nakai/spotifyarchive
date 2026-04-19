import { BrowserRouter, Routes, Route } from "react-router-dom";

import Upload from "../pages/Upload";
import AudioTable from "../pages/AudioTable";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/table" element={<AudioTable/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
