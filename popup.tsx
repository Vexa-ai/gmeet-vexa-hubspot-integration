import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"

import "./style.css"

const storage = new Storage()

function IndexPopup() {
  const [apiKey, setApiKey] = useState("")
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    // Load the saved API key when the popup opens
    storage.get("vexaApiKey").then((savedApiKey) => {
      if (savedApiKey) {
        setApiKey(savedApiKey)
        setStatusMessage("API Key loaded.")
      }
    })
  }, [])

  const handleSaveApiKey = async () => {
    if (apiKey.trim() === "") {
      setStatusMessage("API Key cannot be empty.")
      return
    }
    await storage.set("vexaApiKey", apiKey)
    setStatusMessage("API Key saved!")
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value)
    if (statusMessage) setStatusMessage("") // Clear status when user types
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        width: "300px", // Or a suitable width
        fontFamily: "sans-serif",
      }}>
      <h2 style={{ marginTop: 0, marginBottom: "12px", textAlign: "center" }}>
        Vexa-Hubspot Settings
      </h2>
      <label htmlFor="apiKeyInput" style={{ marginBottom: "4px", fontSize: "14px" }}>
        Vexa API Key:
      </label>
      <input
        id="apiKeyInput"
        type="text"
        value={apiKey}
        onChange={handleInputChange}
        placeholder="Enter your Vexa API Key"
        style={{
          padding: "8px",
          marginBottom: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <button
        onClick={handleSaveApiKey}
        style={{
          padding: "10px 15px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
        }}>
        Save API Key
      </button>
      {statusMessage && (
        <p
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: statusMessage.includes("saved") ? "green" : "red",
            textAlign: "center"
          }}>
          {statusMessage}
        </p>
      )}
    </div>
  )
}

export default IndexPopup
