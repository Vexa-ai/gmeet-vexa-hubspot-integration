import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"

import "./style.css"

const storage = new Storage()

interface HubspotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    company?: string
  }
}

interface ActiveMeetingSession {
  id: string
  startTime: number
  associatedContactIds: string[]
}

function IndexPopup() {
  const [apiKey, setApiKey] = useState("")
  const [hubspotToken, setHubspotToken] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<HubspotContact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  useEffect(() => {
    // Load saved API keys
    Promise.all([
      storage.get("vexaApiKey"),
      storage.get("hubspotAccessToken")
    ]).then(([savedApiKey, savedHubspotToken]) => {
      if (savedApiKey) setApiKey(savedApiKey)
      if (savedHubspotToken) setHubspotToken(savedHubspotToken)
      if (!savedApiKey || !savedHubspotToken) {
        setStatusMessage("Please configure Vexa & HubSpot API keys.")
      }
    })

    // Attempt to load active meeting session
    chrome.runtime.sendMessage({ type: "GET_ACTIVE_MEETING_SESSION" }, (session: ActiveMeetingSession | null) => {
      setIsLoadingSession(false)
      if (chrome.runtime.lastError) {
        console.warn("Error getting active session (might be none):", chrome.runtime.lastError.message)
        setStatusMessage("No active meeting detected.")
        return
      }
      if (session && session.id) {
        console.log("Active meeting session loaded:", session)
        setCurrentMeetingId(session.id)
        setSelectedContacts(session.associatedContactIds || [])
        setStatusMessage(`Active meeting: ${session.id}. Contacts loaded.`)
      } else {
        setStatusMessage("No active Google Meet detected.")
      }
    })
  }, [])

  // Effect to update background script when selectedContacts change for an active meeting
  useEffect(() => {
    if (currentMeetingId && !isLoadingSession) { // Ensure session is loaded before trying to update
      console.log("Selected contacts changed, updating background for meeting:", currentMeetingId, selectedContacts)
      chrome.runtime.sendMessage(
        {
          type: "UPDATE_ASSOCIATED_CONTACTS",
          meetingId: currentMeetingId,
          contactIds: selectedContacts
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error updating associated contacts:", chrome.runtime.lastError.message)
            // Optionally set a status message here if important
          } else if (response && response.success) {
            console.log("Associated contacts updated in background.")
          } else {
            console.warn("Failed to update associated contacts in background:", response?.error)
          }
        }
      )
    }
  }, [selectedContacts, currentMeetingId, isLoadingSession])

  const handleSaveApiKey = async () => {
    if (apiKey.trim() === "") {
      setStatusMessage("Vexa API Key cannot be empty.")
      return
    }
    await storage.set("vexaApiKey", apiKey)
    setStatusMessage("Vexa API Key saved!")
  }

  const handleSaveHubspotToken = async () => {
    if (hubspotToken.trim() === "") {
      setStatusMessage("HubSpot Access Token cannot be empty.")
      return
    }
    await storage.set("hubspotAccessToken", hubspotToken)
    setStatusMessage("HubSpot Access Token saved!")
  }

  const testHubspotToken = async () => {
    if (!hubspotToken) {
      setStatusMessage("Please save HubSpot Access Token first.")
      return
    }
    setStatusMessage("Testing HubSpot connection...")
    try {
      const isLegacyKey = !hubspotToken.startsWith('pat-')
      let response
      if (isLegacyKey) {
        response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts?limit=1&hapikey=${hubspotToken}`, {
          method: "GET"
        })
      } else {
        response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${hubspotToken}`
          }
        })
      }
      if (response.status === 401) {
        setStatusMessage("❌ Token invalid. Check your HubSpot token.")
        return
      }
      if (response.status === 403) {
        setStatusMessage("❌ Missing scopes. Add 'crm.objects.contacts.read' permission.")
        return
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setStatusMessage(`❌ API error: ${response.status} - ${errorData.message || 'Check token permissions'}`)
        return
      }
      const data = await response.json()
      setStatusMessage(`✅ Token works! Found ${data.total || 0} total contacts.`)
    } catch (error) {
      console.error("HubSpot test error:", error)
      setStatusMessage(`❌ Network error: ${error.message}`)
    }
  }

  const handleSearchContacts = async () => {
    if (!hubspotToken) {
      setStatusMessage("Please save HubSpot Access Token first.")
      return
    }
    if (!searchQuery.trim()) {
      setStatusMessage("Please enter a search query.")
      return
    }
    setIsSearching(true)
    setStatusMessage("Searching contacts...")
    try {
      const isLegacyKey = !hubspotToken.startsWith('pat-')
      const searchUrl = isLegacyKey 
        ? `https://api.hubapi.com/crm/v3/objects/contacts/search?hapikey=${hubspotToken}`
        : `https://api.hubapi.com/crm/v3/objects/contacts/search`
      const headers = isLegacyKey
        ? { "Content-Type": "application/json" }
        : {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${hubspotToken}`
          }
      const response = await fetch(searchUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "email",
                  operator: "CONTAINS_TOKEN",
                  value: searchQuery
                }
              ]
            },
            {
              filters: [
                {
                  propertyName: "firstname",
                  operator: "CONTAINS_TOKEN", 
                  value: searchQuery
                }
              ]
            },
            {
              filters: [
                {
                  propertyName: "lastname",
                  operator: "CONTAINS_TOKEN",
                  value: searchQuery
                }
              ]
            }
          ],
          properties: ["firstname", "lastname", "email", "company"],
          limit: 10
        })
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HubSpot API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
      }
      const data = await response.json()
      setSearchResults(data.results || [])
      setStatusMessage(`Found ${data.results?.length || 0} contacts.`)
    } catch (error) {
      console.error("HubSpot search error:", error)
      setStatusMessage(`Search failed: ${error.message}`)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
    // The useEffect for [selectedContacts, currentMeetingId] will handle sending the update
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "apiKey") {
      setApiKey(value)
    } else if (field === "hubspotToken") {
      setHubspotToken(value)
    } else if (field === "search") {
      setSearchQuery(value)
    }
    if (statusMessage && !statusMessage.startsWith("Active meeting:")) setStatusMessage("")
  }

  const handleLogToHubspot = async () => {
    if (!currentMeetingId) {
      setStatusMessage("No active meeting to log. Is a Google Meet running?")
      return
    }
    if (selectedContacts.length === 0) {
      setStatusMessage("Please select at least one contact to log the call for this meeting.")
      return
    }
    if (!apiKey || !hubspotToken) {
      setStatusMessage("Please ensure Vexa API Key and HubSpot Token are saved.")
      return
    }

    setIsLogging(true)
    setStatusMessage("Logging call to HubSpot...")

    chrome.runtime.sendMessage(
      { 
        type: "LOG_TO_HUBSPOT", 
        meetingId: currentMeetingId // Background script will use this to get associated contacts
      },
      (response) => {
        setIsLogging(false)
        if (chrome.runtime.lastError) {
          console.error("Error sending LOG_TO_HUBSPOT message:", chrome.runtime.lastError.message)
          setStatusMessage(`Error: ${chrome.runtime.lastError.message}`)
        } else if (response && response.success) {
          setStatusMessage("✅ Call logged to HubSpot successfully!")
        } else {
          setStatusMessage(`❌ Failed to log call: ${response?.error || 'Unknown error'}`)
        }
      }
    )
  }

  if (isLoadingSession) {
    return (
      <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
        Loading session information...
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        width: "350px",
        maxHeight: "600px",
        fontFamily: "sans-serif",
        overflow: "auto"
      }}>
      <h2 style={{ marginTop: 0, marginBottom: "16px", textAlign: "center" }}>
        Vexa-HubSpot Integration
      </h2>
      
      {/* Meeting Info Display */}
      {currentMeetingId && (
        <div style={{ marginBottom: "12px", padding: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", fontSize: "13px", textAlign: "center"}}>
          Active Meeting: <strong>{currentMeetingId}</strong>
        </div>
      )}

      {/* Vexa API Key Section */}
      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="apiKeyInput" style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>
          Vexa API Key:
        </label>
        <input
          id="apiKeyInput"
          type="password"
          value={apiKey}
          onChange={(e) => handleInputChange("apiKey", e.target.value)}
          placeholder="Enter your Vexa API Key"
          style={{
            padding: "8px",
            marginBottom: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "100%",
            boxSizing: "border-box"
          }}
        />
        <button
          onClick={handleSaveApiKey}
          style={{
            padding: "8px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            width: "100%"
          }}>
          Save Vexa API Key
        </button>
      </div>

      {/* HubSpot Token Section */}
      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="hubspotTokenInput" style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>
          HubSpot Access Token:
        </label>
        <input
          id="hubspotTokenInput"
          type="password"
          value={hubspotToken}
          onChange={(e) => handleInputChange("hubspotToken", e.target.value)}
          placeholder="Enter your HubSpot Private App Access Token"
          style={{
            padding: "8px",
            marginBottom: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "100%",
            boxSizing: "border-box"
          }}
        />
        <button
          onClick={handleSaveHubspotToken}
          style={{
            padding: "8px 12px",
            backgroundColor: "#ff6b35",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            width: "100%"
          }}>
          Save HubSpot Token
        </button>
        {hubspotToken && (
          <button
            onClick={testHubspotToken}
            style={{
              padding: "6px 10px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              width: "100%",
              marginTop: "4px"
            }}>
            Test Token
          </button>
        )}
      </div>

      {/* Contact Search Section - Show only if a meeting is active */}
      {currentMeetingId && hubspotToken && (
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="searchInput" style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>
            Search & Associate HubSpot Contacts (for {currentMeetingId}):
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="searchInput"
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange("search", e.target.value)}
              placeholder="Search by name or email"
              onKeyPress={(e) => e.key === 'Enter' && handleSearchContacts()}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                flex: 1
              }}
            />
            <button
              onClick={handleSearchContacts}
              disabled={isSearching}
              style={{
                padding: "8px 12px",
                backgroundColor: isSearching ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSearching ? "not-allowed" : "pointer",
                fontSize: "14px"
              }}>
              {isSearching ? "..." : "Search"}
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {currentMeetingId && searchResults.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Select contacts to associate:</h4>
          <div style={{ maxHeight: "150px", overflow: "auto", border: "1px solid #ddd", borderRadius: "4px" }}>
            {searchResults.map((contact) => (
              <div
                key={contact.id}
                onClick={() => toggleContactSelection(contact.id)}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  backgroundColor: selectedContacts.includes(contact.id) ? "#e7f3ff" : "white",
                  fontSize: "13px"
                }}>
                <div style={{ fontWeight: "bold" }}>
                  {contact.properties.firstname} {contact.properties.lastname}
                </div>
                <div style={{ color: "#666" }}>{contact.properties.email}</div>
                {contact.properties.company && (
                  <div style={{ color: "#888", fontSize: "12px" }}>{contact.properties.company}</div>
                )}
              </div>
            ))}
          </div>
          {selectedContacts.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
              {selectedContacts.length} contact(s) associated with this meeting.
            </div>
          )}
        </div>
      )}

      {/* Log to HubSpot Button - Show if meeting active and contacts selected */}
      {currentMeetingId && selectedContacts.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <button
            onClick={handleLogToHubspot}
            disabled={isLogging}
            style={{
              padding: "10px 15px",
              backgroundColor: isLogging ? "#ccc" : "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLogging ? "not-allowed" : "pointer",
              fontSize: "16px",
              width: "100%"
            }}>
            {isLogging ? "Logging..." : "Log Call to HubSpot"}
          </button>
        </div>
      )}
      {!currentMeetingId && hubspotToken && (
         <p style={{ marginTop: "10px", fontSize: "13px", color: "orange", textAlign: "center"}}>
           Join a Google Meet to search and associate contacts.
         </p>
      )}

      {/* Status Message */}
      {statusMessage && (
        <p
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: statusMessage.includes("saved") || statusMessage.includes("✅") || statusMessage.includes("loaded.") || statusMessage.includes("Active meeting:") ? "green" : 
                   statusMessage.includes("Found") || statusMessage.includes("No active Google Meet detected.") ? "blue" : 
                   statusMessage.includes("Please configure") || statusMessage.includes("No active meeting detected.") ? "orange" :
                   "red",
            textAlign: "center"
          }}>
          {statusMessage}
        </p>
      )}

      {/* Help Text */}
      <div style={{ marginTop: "16px", fontSize: "11px", color: "#666", textAlign: "center" }}>
        Create a HubSpot Private App in Settings → Integrations → Private Apps
      </div>
    </div>
  )
}

export default IndexPopup
