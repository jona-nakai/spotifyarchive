import { useState, useRef } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { SpotifyJson } from "./types";
import type { ValidFile } from "./types";
import JSZip from "jszip";
import './Home.css'

type HomeProps = {
  files: ValidFile[];
  setFiles: React.Dispatch<React.SetStateAction<ValidFile[]>>;
};

function Home({ files, setFiles }: HomeProps) {
  
  type FileStatus = "noFiles" | "unzipping" | "validating" | "filesUploaded";
  const [status, setStatus] = useState<FileStatus>("noFiles")

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (status != "noFiles" && status != "filesUploaded") return;
    const droppedFilesList = event.dataTransfer.files;
    const droppedFiles= Array.from(droppedFilesList);
    console.log("Received files via dropped files")
    unzipFiles(droppedFiles);
    
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (status != "noFiles" && status != "filesUploaded") return;
    const uploadedFilesList = event.currentTarget.files;
    if (!uploadedFilesList) return;
    const uploadedFiles = Array.from(uploadedFilesList)
    console.log("Received files via file browser")
    unzipFiles(uploadedFiles)
  }
  
  const runIdRef = useRef(0);

  const canCancel = status !== "noFiles" && status !== "filesUploaded";
  const handleCancel = () => {
    runIdRef.current += 1;
  }
  const handleReset = () => {
    if (files) {
      setStatus("filesUploaded");
    } else {
      setStatus("noFiles");
    }
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
    console.log("Finished unzipping user files")
    validateFiles(unzippedFiles)
  } 
  
  const validateFiles = async (fileContent: FileContent[]) => {
    const runId = runIdRef.current;
    console.log("File validation started");
    setStatus("validating");
    const validFiles: ValidFile[] = [];
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
        const json_data = await JSON.parse(fileContent[i].content);
        if (runIdRef.current != runId) {
          console.log("File validation aborted by user");
          handleReset();
          return;
        }
        const result = z.array(SpotifyJson).safeParse(json_data)
        if (!result.success) {
          throw result.error;
        }
        validFiles.push({ name: name, data: result.data });
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

    setFiles(validFiles);
    setStatus("filesUploaded");
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
        disabled={files.length === 0}
        onClick={() => navigate("/table")}
      >
        Take me to my data!
      </button>
      
      {files.map(file => <div key={file.name}>{file.name}</div>)}

      <div>{errors}</div>
   </>
  )
}

export default Home
