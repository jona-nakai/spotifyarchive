import { useState, useRef, useEffect } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { SpotifyJson } from "../types";
import type { SpotifyJsonType } from "../types";
import { saveRecords, hasRecords } from "../db";
import { redirectToSpotifyAuth } from "../spotify.ts"
import JSZip from "jszip";
import "./Upload.css"

function Home() {
  // Tracks page upload status
  type UploadStatus = "checkingData" | "noFiles" | "warningModal" | "unzipping" | "validating" | "saveRecords" | "uploadComplete";
  const [status, setStatus] = useState<UploadStatus>("checkingData");  
  
  // Check if complete data is stored
  useEffect(() => {
    hasRecords().then((complete) => {
      if (!complete) {
        setStatus("noFiles");
      } else {
        setStatus("uploadComplete");
      }
    })
  }, [])

  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  
  // Receives file if dragged and dropped
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (status != "noFiles" && status != "uploadComplete") return;
    const droppedFilesList = event.dataTransfer.files;
    const uploadedFiles = Array.from(droppedFilesList);
    console.log("Received files via dropped files")
    setPendingFiles(uploadedFiles);
    setStatus("warningModal");
    setShowWarningModal(true);
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
    setPendingFiles(uploadedFiles);
    setStatus("warningModal");
    setShowWarningModal(true);
  }

  const handleReset = async () => {
    const complete = await hasRecords();

    if (complete) {
      setStatus("uploadComplete");
    } else {
      setStatus("noFiles");
    }
  }

  const handleWarningProceed = async () => {
    setShowWarningModal(false);
    if (!pendingFiles) {
      setShowWarningModal(false);
      setPendingFiles(null);
      await handleReset();
      return;
    }
    loadFileProcess(pendingFiles);
    setPendingFiles(null);
  }

  const handleWarningCancel = async () => {
    setShowWarningModal(false);
    setPendingFiles(null);
    await handleReset();
  }
 
  // Toggles cancel button if a file is being uploaded and processed
  const runIdRef = useRef(0);
  const canCancel = 
    status === "unzipping" || 
    status === "validating" ||
    status === "saveRecords";
  const handleCancel = () => {
    runIdRef.current += 1;
  }

  type FileContent = {name: string, content: string};

  const [errors, setErrors] = useState<string[]>([])

  const unzipFiles = async (files: File[], runId: number) => {
   
    console.log("Started unzipping user files")
    const unzippedFiles: FileContent[] = [];

    for (const file of files) {
      if (runIdRef.current != runId) return;

      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const zip = await JSZip.loadAsync(file);
          if (runIdRef.current != runId) return;
          for (const [name, zipContent] of Object.entries(zip.files)) {
            if (zipContent.dir) continue;
            const content = await zipContent.async("text");
            if (runIdRef.current != runId) return;
            unzippedFiles.push({name: name, content: content})
          }
        } catch (error) {
          setErrors((prev) => [...prev, `Error unzipping ${file.name}: ${error}`]);
        } 
      } else {
        try {
          const name = file.name;
          const content = await file.text();
          if (runIdRef.current != runId) return;
          unzippedFiles.push({name: name, content: content})
        } catch (error) {
          setErrors((prev) => [...prev, `Error: ${error}`])
        }
      }
    }
    if (unzippedFiles.length == 0) {
      setErrors((prev) => [...prev, `Error: No files loaded`]);
      return;
    }
    
    return unzippedFiles
  } 
  
  const validateFiles = async (fileContent: FileContent[], runId: number) => {
    console.log("File validation started");
    const validFiles: SpotifyJsonType[] = [];
    for (let i = 0; i < fileContent.length; i++) {
      if (runIdRef.current != runId) return;
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
        if (runIdRef.current !== runId) return;
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
      return;
    }

    return validFiles;
  }

  const loadFileProcess = async (uploadedFiles: File[]) => {
    runIdRef.current += 1;
    const runId = runIdRef.current;
    setErrors([])
 
    setStatus("unzipping");
    const unzippedFiles = await unzipFiles(uploadedFiles, runId);
    if (!unzippedFiles) {
      handleReset();
      return;
    }

    setStatus("validating");
    const validFiles = await validateFiles(unzippedFiles, runId);
    if (!validFiles) {
      handleReset();
      return;
    }

    setStatus("saveRecords");
    const saved = await saveRecords(
      validFiles,
      () => runIdRef.current !== runId
    );
    if (!saved) {
      handleReset();
      return;
    }

    setStatus("uploadComplete");
  }

  const navigate = useNavigate()

  return (
    <>

      <header>
        <h1>Spotify Archive</h1>
      </header>

      <button onClick={redirectToSpotifyAuth}>
        Spotify Auth
      </button>

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
        disabled={status !== "uploadComplete" || canCancel}
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
