import { useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import './App.css'

function App() {
  
  const [files, setFiles] = useState<File[]>([]);
  type FileStatus = "noFiles" | "uploading" | "validating" | "filesUploaded";
  const [status, setStatus] = useState<FileStatus>("noFiles")

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setStatus("uploading");
    const droppedFiles = event.dataTransfer.files;
    const droppedFilesList = Array.from(droppedFiles)
    setStatus("validating")
    const isValid = validateFiles(droppedFiles);
    if (isValid) {
      setFiles(droppedFilesList)
      setStatus("filesUploaded")
    } else {
      setStatus("noFiles")
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    setStatus("uploading")
    const uploadedFiles = event.currentTarget.files;
    if (!uploadedFiles) return;
    const uploadedFilesList = Array.from(uploadedFiles)
    setStatus("validating");
    const isValid = validateFiles(uploadedFiles)
    if (isValid) {
      setFiles(uploadedFilesList);
      setStatus("filesUploaded");
    } else {
      setStatus("noFiles");
    }
  }

  const validateFiles = (droppedFiles: FileList) => {
    for (let i=0; i<droppedFiles.length; i++) {
      const name = droppedFiles[i].name
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
