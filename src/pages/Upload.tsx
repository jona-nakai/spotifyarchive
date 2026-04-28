import { useState, useRef, useEffect } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { SpotifyJson } from "../types/types";
import type { SpotifyJsonType } from "../types/types";
import { saveRecords, hasRecords, createAudioStores } from "../db/db";
import JSZip from "jszip";
import './Upload.css'

function Home() {
  
  type UploadStatus = "noFiles" | "unzip" | "validate" | "saveRecords" | "createAudioStores" | "aggregateData" | "uploadComplete";
  // Status for if a file has been uploaded and processed
  const [status, setStatus] = useState<UploadStatus>("noFiles");  
  const [showWarningModal, setShowWarningModal] = useState<Boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<Files[] | null>(null);
  
  // Receives file if dragged and dropped
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (status != "noFiles" && status != "uploadComplete") return;
    const droppedFilesList = event.dataTransfer.files;
    const uploadedFiles = Array.from(droppedFilesList);
    console.log("Received files via dropped files")
    setShowWarningModal(true);
    setPendingFiles(uploadedFiles);
  }

  // Handle file dragging behavior
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }
  
  // Opens file browser for user to upload file
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (status != "noFiles" && status != "uploadComplete") return;
    const uploadedFilesList = event.currentTarget.files;
    if (!uploadedFilesList) return;
    const uploadedFiles = Array.from(uploadedFilesList)
    console.log("Received files via file browser");
    setShowWarningModal(true);
    setPendingFiles(uploadedFiles);
  } 

  const handleWarningProceed = () => {
    setShowWarningModal(false);
    const uploadedFiles = pendingFiles;
    setPendingFiles(null);
    loadFileProcess(uploadedFiles);
  }

  const handleWarningCancel = () => {
    setShotWarningModal(false);
    setPendingFiles(null);
  }
 
  // Toggles cancel button if a file is being uploaded and processed
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
    
    console.log("Started unzipping user files")
    setStatus("unzipping")
    const unzippedFiles: FileContent[] = Array()

    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          console.log(`Unzipping ${file.name}`)
          const zip = await JSZip.loadAsync(file);
          if (runIdRef.current != runId) {
            console.log("File processing aborted by user");
            handleReset();
            return;
          }
          for (const [name, zipContent] of Object.entries(zip.files)) {
            if (zipContent.dir) continue;
            const content = await zipContent.async("text");
            unzippedFiles.push({name: name, content: content})
          }
          console.log(`File ${file.name} unzipped`)
        } catch (error) {
          setErrors((prev) => [...prev, `Error unzipping ${file.name}: ${error}`]);
        } 
      } else {
        try {
          const name = file.name;
          const content = await file.text();
          unzippedFiles.push({name: name, content: content})
        } catch (error) {
          setErrors((prev) => [...prev, `Error: ${error}`])
        }
      }
    }
    if (unzippedFiles.length == 0) {
      setErrors((prev) => [...prev, `Error: No files loaded`]);
      handleReset();
      return;
    }
    
    return unzippedFiles
  } 
  
  const validateFiles = async (fileContent: FileContent[]) => {
    const runId = runIdRef.current;
    console.log("File validation started");
    setStatus("validating");
    const validFiles: SpotifyJsonType[] = [];
    for (let i=0; i<fileContent.length; i++) {
      const name = fileContent[i].name
      if (name.endsWith("ReadMeFirst_ExtendedStreamingHistory.pdf")) {
        continue;
      } else if (!name.toLowerCase().endsWith(".json")) {
        setErrors((prev) => [...prev, `File not accepted: ${name}`]);
        continue;
      }
      try {
        console.log(`Starting validation for file ${name}`)
        const json_data = JSON.parse(fileContent[i].content);
        if (runIdRef.current != runId) {
          console.log("File validation aborted by user");
          handleReset();
          return;
        }
        const result = z.array(SpotifyJson).safeParse(json_data)
        if (!result.success) {
          throw result.error;
        }
        validFiles.push(...result.data)
        console.log(`File ${name} validated`)
      } catch (error) {
        setErrors((prev) => [...prev, `Error parsing ${name}: ${error}`]);
      } 
    }
    if (validFiles.length == 0) {
      setErrors((prev) => [...prev, `Error: No files after validation`]);
      handleReset();
      return;
    }

    setStatus("filesUploaded");
    setHasData(true)
  }

  const loadFileProcess = async (uploadedFiles: File[]) => {
    const unzippedFiles = await unzipFiles(uploadedFiles);
    const validFiles = await validateFiles(unzippedFiles);
    await saveRecords(validFiles);
    await createAudioStores();
  }

  const navigate = useNavigate()

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
        multiple
        onChange={handleInput}
        disabled={canCancel}
        // hidden
      />

      <button
        onClick={handleCancel}
        disabled={!canCancel}
      >
        Cancel
      </button>

      <button
        disabled={!hasData || canCancel}
        onClick={() => navigate("/stats")}
      >
        Take me to my data!
      </button>
      

      <div>{errors}</div>

      {showWarningModal && (
        <>
          <div>
            <div>Warning</div>
            <button onClick={handleWarningProceed}>Proceed</button>
            <button onClick={handleWarningCancel}>Cancel</button>
          </div>
        </>
      )}
   </>
  )
}

export default Home
