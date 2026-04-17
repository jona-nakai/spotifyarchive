import { useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import './App.css'

function App() {
  
  const [files, setFiles] = useState<File[]>([]);
  type FileStatus = "noFiles" | "uploading" | "validating" | "filesUploaded";
  const [status, setStatus] = useState<FileStatus>("idle")

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setStatus("uploading");
    const droppedFiles = event.dataTransfer.files;
    setStatus("validating")
    const isValid = validateFiles(droppedFiles);
    if (isValid) => {
      setFiles(droppedFiles)
      setStatus("filesUploaded")
    } else {
      setStatus("noFiles")
    }
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  }

  const handleInput = (event: ChangeEvent) => {
    setStatus("uploading")
    const uploadedFiles = event.currentTarget.files;
    if (!uploadedFiles) return;
    setStatus("validating");
    const isValid = validateFiles(uploadedFiles)
    if (isValid) => {
      setFiles(uploadedFiles)
      setStatus("filesUploaded")
    } else {
      setStatus("noFiles")
    }
  }

  const validateFiles = (droppedFiles: FileList) => {
    for (let i=0; i<droppedFiles.length; i++) {
      const name = droppedFiles[i]
    }
  }

  return (
    <>
      <header>
        <h1>Spotify Archive</h1>
      </header>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p>File Upload</p>
      </div> 
      <input 
        type="file" 
        onChange={handleInput} 
        hidden 
      />
    </>
  )
}

export default App
