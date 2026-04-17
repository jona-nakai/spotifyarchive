import { useState, useRef } from "react";
import type { DragEvent, ChangeEvent } from "react";
import JSZip from "jszip";
import './App.css'

function App() {
  
  const [files, setFiles] = useState<File[]>([]);
  type FileStatus = "noFiles" | "unzipping" | "validating" | "filesUploaded";
  const [status, setStatus] = useState<FileStatus>("noFiles")

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (status != "noFiles") return;
    const droppedFilesList = event.dataTransfer.files;
    const droppedFiles= Array.from(droppedFilesList);
    unzipFiles(droppedFiles);
    
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (status != "noFiles") return;
    const uploadedFilesList = event.currentTarget.files;
    if (!uploadedFilesList) return;
    const uploadedFiles = Array.from(uploadedFilesList)
    unzipFiles(uploadedFiles)
  }
  
  const runIdRef = useRef(0);

  const canCancel = status !== "noFiles" && status !== "filesUploaded";
  const handleCancel = () => {
    runIdRef.current += 1;
  }

  type FileContent = {name: string, content: string};

  const [errors, setErrors] = useState<string[]>([])

  const unzipFiles = async (files: File[]) => {
    runIdRef.current += 1;
    const runId = runIdRef.current;
    setErrors([])

    setStatus("unzipping")
    const unzippedFiles: FileContent[] = Array()

    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const zip = await JSZip.loadAsync(file);
          if (runIdRef.current != runId) {
            return;
          }
          for (const [name, zipContent] of Object.entries(zip.files)) {
            if (zipContent.dir) continue;
            const content = await zipContent.async("text");
            unzippedFiles.push({name: name, content: content})
          }
        } catch (error) {
          setErrors((prev) => [...prev, `Error unzipping ${file.name}: ${error}`]);
        } 
      } else {
        const name = file.name;
        const content = await file.text();
        unzippedFiles.push({name: name, content: content})
      }
    }
    
    validateFiles(unzippedFiles)
  }

  const validateFiles = async (fileContent: FileContent[]) => {
    setStatus("validating");
    const validFiles: FileContent[] = [];
    for (let i=0; i<fileContent.length; i++) {
      const name = fileContent[i].name
      if (name === "ReadMeFirst_ExtendedStreamingHistory.pdf") {
        continue
      } else if (!name.toLowerCase().endsWith(".json")) {
        setErrors((prev) => [...prev, `File not accepted: ${name}`]);
      }
      try {
        const json_data = await JSON.parse(fileContent[i].content);

      } catch (error) {
        setErrors((prev) => [...prev, `Error parsing ${name}: ${error}`])
      }
      
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
        // hidden
      />

      <button
        onClick={handleCancel}
        disabled={!canCancel}
      >
        Cancel
      </button>

      <div>{errors}</div>
   </>
  )
}

export default App
