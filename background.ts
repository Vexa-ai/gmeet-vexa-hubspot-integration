import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const ACTIVE_MEETING_SESSION_KEY = "activeMeetingSession_v1"

console.log("Vexa-Hubspot background script loaded.")

// Clear any stale active session on startup or install
const clearActiveSession = async () => {
  await storage.remove(ACTIVE_MEETING_SESSION_KEY)
  console.log("Cleared any stale active meeting session.")
}
chrome.runtime.onStartup.addListener(clearActiveSession)
chrome.runtime.onInstalled.addListener(clearActiveSession)

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message)

  if (message.type === "MEETING_STARTED") {
    handleMeetingStarted(message.meetingId, sendResponse)
    return true
  } else if (message.type === "LOG_TO_HUBSPOT") {
    console.log(`[BACKGROUND] Received LOG_TO_HUBSPOT. Message MeetingId: '${message.meetingId}', Type: ${typeof message.meetingId}`);
    handleLogToHubspotInBackground(message.meetingId, sendResponse)
    return true
  } else if (message.type === "GET_ACTIVE_MEETING_SESSION") {
    storage.get(ACTIVE_MEETING_SESSION_KEY).then(sessionData => {
      console.log("[BACKGROUND] GET_ACTIVE_MEETING_SESSION: Retrieved from storage:", sessionData);
      sendResponse(sessionData);
    });
    return true
  } else if (message.type === "UPDATE_ASSOCIATED_CONTACTS") {
    handleUpdateAssociatedContacts(message.meetingId, message.contactIds, sendResponse);
    return true
  } else if (message.type === "MEETING_ENDED") {
    handleMeetingEndedLogic(message.meetingId, sendResponse)
    return true
  }

  return false
})

async function handleMeetingStarted(meetingId: string, sendResponse: (response: any) => void) {
  try {
    console.log("Handling meeting started for ID:", meetingId)
    const apiKey = await storage.get("vexaApiKey")
    if (!apiKey) {
      const errorMsg = "No Vexa API key found. Please configure it in the extension popup."
      console.error("Vexa-Hubspot:", errorMsg)
      sendResponse({ success: false, error: errorMsg })
      return
    }

    // Store new active meeting session, overwriting any previous one
    const newSession = { 
      id: meetingId, 
      startTime: Date.now(), 
      associatedContactIds: [] 
    }
    await storage.set(ACTIVE_MEETING_SESSION_KEY, newSession)
    console.log("New active meeting session stored:", newSession)

    console.log("Vexa API key found, deploying bot...")
    const botResponse = await deployVexaBot(meetingId, apiKey)
    
    if (botResponse.success) {
      console.log("Vexa bot successfully deployed:", botResponse.data)
      sendResponse({ success: true, message: "Bot deployed successfully", data: botResponse.data, meetingSession: newSession })
    } else {
      console.error("Failed to deploy Vexa bot:", botResponse.error)
      sendResponse({ success: false, error: botResponse.error })
    }
    
  } catch (error) {
    console.error("Error in handleMeetingStarted:", error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleUpdateAssociatedContacts(
  meetingId: string, 
  contactIds: string[], 
  sendResponse: (response: any) => void
) {
  try {
    const currentSession = await storage.get(ACTIVE_MEETING_SESSION_KEY) as any
    if (currentSession && currentSession.id === meetingId) {
      currentSession.associatedContactIds = contactIds
      await storage.set(ACTIVE_MEETING_SESSION_KEY, currentSession)
      console.log(`Updated associated contacts for meeting ${meetingId}:`, contactIds)
      sendResponse({ success: true, updatedSession: currentSession })
    } else {
      const errorMsg = `No active session found for meeting ID ${meetingId} or ID mismatch.`
      console.warn(errorMsg, "Current session:", currentSession)
      sendResponse({ success: false, error: errorMsg })
    }
  } catch (error) {
    console.error("Error updating associated contacts:", error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleLogToHubspotInBackground(
  meetingId: string,
  sendResponse: (response: any) => void
) {
  try {
    const currentSession = await storage.get(ACTIVE_MEETING_SESSION_KEY) as any;
    console.log(`[BACKGROUND] handleLogToHubspotInBackground: Incoming meetingId: '${meetingId}', Type: ${typeof meetingId}`);
    console.log("[BACKGROUND] handleLogToHubspotInBackground: Fetched currentSession from storage:", currentSession);

    if (!currentSession || currentSession.id !== meetingId) {
      const errorMsg = `No active session found for meeting ID ${meetingId} to log, or ID mismatch. Session ID: ${currentSession?.id}`;
      console.error("Vexa-Hubspot:", errorMsg, "Current session from storage:", currentSession, "Popup meetingId:", meetingId);
      sendResponse({ success: false, error: errorMsg });
      return
    }

    const contactIds = currentSession.associatedContactIds
    if (!contactIds || contactIds.length === 0) {
      const errorMsg = `No contacts associated with meeting ID ${meetingId}. Please select contacts in the popup.`
      console.error("Vexa-Hubspot:", errorMsg)
      sendResponse({ success: false, error: errorMsg })
      return
    }

    console.log(`Logging call to HubSpot for meeting ${meetingId}, contacts: ${contactIds.join(", ")}`)

    const hubspotToken = await storage.get("hubspotAccessToken")
    const vexaApiKey = await storage.get("vexaApiKey")

    if (!hubspotToken || !vexaApiKey) {
      const errorMsg = "HubSpot Token or Vexa API Key not found. Please configure them in the extension popup."
      console.error("Vexa-Hubspot:", errorMsg)
      sendResponse({ success: false, error: errorMsg })
      return
    }

    // --- Fetch Transcript from Vexa ---
    console.log(`Fetching transcript for meeting ID: ${meetingId}`);
    const transcriptResponse = await retrieveTranscript(meetingId, vexaApiKey);

    let transcriptText: string;

    if (transcriptResponse.success && transcriptResponse.data) {
      const vexaData = transcriptResponse.data;
      // Try to extract transcript text in a few common ways, Vexa API structure dependent
      if (typeof vexaData.transcript === 'string') {
        transcriptText = vexaData.transcript;
      } else if (vexaData.transcript && typeof vexaData.transcript.text_formatted === 'string') {
        transcriptText = vexaData.transcript.text_formatted;
      } else if (typeof vexaData.text_formatted === 'string') {
        transcriptText = vexaData.text_formatted;
      } else if (typeof vexaData.text === 'string') {
        transcriptText = vexaData.text;
      } else if (Array.isArray(vexaData.segments)) {
        transcriptText = vexaData.segments
          .map(segment => `${segment.speaker_label || segment.speaker || 'Unknown Speaker'}: ${segment.text || segment.line || ''}`)
          .join('\n');
      } else {
        // Fallback to stringifying the whole data object if no specific text field is found
        transcriptText = JSON.stringify(vexaData, null, 2);
      }
      console.log("Using fetched Vexa transcript.");
    } else {
      const errorMsg = `Failed to retrieve Vexa transcript: ${transcriptResponse.error || 'Unknown error'}. Call cannot be logged with transcript.`;
      console.error("Vexa-Hubspot:", errorMsg);
      sendResponse({ success: false, error: errorMsg });
      return;
    }

    const logResult = await logCallToHubspot(hubspotToken, contactIds, transcriptText, meetingId)

    if (logResult.success) {
      console.log("Call logged to HubSpot successfully:", logResult.data)
      sendResponse({ success: true, data: logResult.data })
    } else {
      console.error("Failed to log call to HubSpot:", logResult.error)
      sendResponse({ success: false, error: logResult.error })
    }

  } catch (error) {
    console.error("Error in handleLogToHubspotInBackground:", error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleMeetingEndedLogic(meetingId: string, sendResponse: (response: any) => void) {
  console.log(`Logic for meeting ended: ${meetingId}. Clearing active session.`);
  // TODO: Implement actual transcript fetching and potential auto-logging here
  // For now, just clear the active session
  await storage.remove(ACTIVE_MEETING_SESSION_KEY)
  sendResponse({ success: true, message: `Session for meeting ${meetingId} cleared.` })
}

async function deployVexaBot(meetingId: string, apiKey: string) {
  try {
    console.log("Calling Vexa API to deploy bot for meeting:", meetingId)
    
    const response = await fetch("https://gateway.dev.vexa.ai/bots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify({
        native_meeting_id: meetingId,
        platform: "google_meet"
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Vexa API error response:", response.status, errorText)
      return {
        success: false,
        error: `Vexa API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()
    console.log("Vexa API success response:", data)
    
    return {
      success: true,
      data: data
    }
    
  } catch (error) {
    console.error("Network error calling Vexa API:", error)
    return {
      success: false,
      error: `Network error: ${error.message}`
    }
  }
}

async function retrieveTranscript(meetingId: string, apiKey: string) {
  try {
    console.log("Calling Vexa API to retrieve transcript for meeting:", meetingId)
    
    const response = await fetch(`https://gateway.dev.vexa.ai/transcripts/google_meet/${meetingId}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Vexa transcript API error response:", response.status, errorText)
      return {
        success: false,
        error: `Vexa transcript API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()
    console.log("Vexa transcript API success response:", data)
    
    return {
      success: true,
      data: data
    }
    
  } catch (error) {
    console.error("Network error calling Vexa transcript API:", error)
    return {
      success: false,
      error: `Network error: ${error.message}`
    }
  }
}

async function logCallToHubspot(
  token: string, 
  contactIds: string[], 
  transcriptText: string,
  meetingId: string // For call title or other metadata
) {
  const isLegacyKey = !token.startsWith('pat-')
  const engagementUrl = isLegacyKey
    ? `https://api.hubapi.com/engagements/v1/engagements?hapikey=${token}`
    : `https://api.hubapi.com/engagements/v1/engagements`

  const headers = isLegacyKey
    ? { "Content-Type": "application/json" }
    : {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
  
  const callBody = `Meeting Transcript (${meetingId})\n\n${transcriptText}`
  const now = Date.now()

  const engagementData = {
    engagement: {
      active: true,
      // ownerId: 1, // Optional: associate with a specific HubSpot user ID
      type: "CALL",
      timestamp: now, // Timestamp of when the call occurred (or was logged)
    },
    associations: {
      contactIds: contactIds, // Array of contact IDs
      companyIds: [],
      dealIds: [],
      // ownerIds: [],
      // ticketIds: []
    },
    metadata: {
      body: callBody, // The actual transcript
      // title: `Google Meet Call - ${meetingId}`, // Optional title for the engagement in HubSpot UI
      // toNumber: "", // If applicable
      // fromNumber: "", // If applicable
      // status: "COMPLETED", // Call status
      // durationMilliseconds: 360000 // Example: 1 hour
    }
  }

  try {
    console.log("Logging call to HubSpot with data:", JSON.stringify(engagementData, null, 2))
    const response = await fetch(engagementUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(engagementData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("HubSpot log call API error response:", response.status, errorText)
      return {
        success: false,
        error: `HubSpot API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()
    console.log("HubSpot log call API success response:", data)
    return { success: true, data: data }

  } catch (error) {
    console.error("Network error logging call to HubSpot:", error)
    return { success: false, error: `Network error: ${error.message}` }
  }
}

// Optional: Listen for extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Vexa-Hubspot extension started.")
})

chrome.runtime.onInstalled.addListener((details) => {
  console.log("Vexa-Hubspot extension installed/updated:", details.reason)
}) 