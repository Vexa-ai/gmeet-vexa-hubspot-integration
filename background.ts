import { Storage } from "@plasmohq/storage"

const storage = new Storage()

console.log("Vexa-Hubspot background script loaded.")

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message)

  if (message.type === "MEETING_STARTED") {
    handleMeetingStarted(message.meetingId, sendResponse)
    return true // Keep the message channel open for async response
  } else if (message.type === "LOG_TO_HUBSPOT") {
    handleLogToHubspotInBackground(message.meetingId, message.contactIds, sendResponse)
    return true // Keep the message channel open for async response
  }

  if (message.type === "MEETING_ENDED") {
    handleMeetingEnded(message.meetingId, message.duration, sendResponse)
    return true // Keep the message channel open for async response
  }

  // Add other message handlers here as needed
  return false
})

async function handleMeetingStarted(meetingId: string, sendResponse: (response: any) => void) {
  try {
    console.log("Handling meeting started for ID:", meetingId)
    
    // Get the stored Vexa API key
    const apiKey = await storage.get("vexaApiKey")
    if (!apiKey) {
      const errorMsg = "No Vexa API key found. Please configure it in the extension popup."
      console.error("Vexa-Hubspot:", errorMsg)
      sendResponse({ success: false, error: errorMsg })
      return
    }

    console.log("Vexa API key found, deploying bot...")
    
    // Call Vexa API to deploy bot
    const botResponse = await deployVexaBot(meetingId, apiKey)
    
    if (botResponse.success) {
      console.log("Vexa bot successfully deployed:", botResponse.data)
      sendResponse({ success: true, message: "Bot deployed successfully", data: botResponse.data })
    } else {
      console.error("Failed to deploy Vexa bot:", botResponse.error)
      sendResponse({ success: false, error: botResponse.error })
    }
    
  } catch (error) {
    console.error("Error in handleMeetingStarted:", error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleMeetingEnded(meetingId: string, duration: number, sendResponse: (response: any) => void) {
  try {
    console.log("Handling meeting ended for ID:", meetingId, "Duration:", duration + "ms")
    
    // Get the stored Vexa API key
    const apiKey = await storage.get("vexaApiKey")
    if (!apiKey) {
      const errorMsg = "No Vexa API key found. Cannot retrieve transcript."
      console.error("Vexa-Hubspot:", errorMsg)
      sendResponse({ success: false, error: errorMsg })
      return
    }

    // Wait a bit for the transcript to be processed
    console.log("Waiting 5 seconds for transcript to be processed...")
    setTimeout(async () => {
      try {
        const transcriptResponse = await retrieveTranscript(meetingId, apiKey)
        
        if (transcriptResponse.success) {
          console.log("Transcript retrieved successfully:", transcriptResponse.data)
          sendResponse({ 
            success: true, 
            message: "Transcript retrieved successfully", 
            transcript: transcriptResponse.data,
            meetingId: meetingId,
            duration: duration
          })
        } else {
          console.error("Failed to retrieve transcript:", transcriptResponse.error)
          sendResponse({ success: false, error: transcriptResponse.error })
        }
      } catch (error) {
        console.error("Error retrieving transcript:", error)
        sendResponse({ success: false, error: error.message })
      }
    }, 5000) // Wait 5 seconds
    
  } catch (error) {
    console.error("Error in handleMeetingEnded:", error)
    sendResponse({ success: false, error: error.message })
  }
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

async function handleLogToHubspotInBackground(
  meetingId: string, 
  contactIds: string[], 
  sendResponse: (response: any) => void
) {
  try {
    console.log(`Logging call to HubSpot for meeting ${meetingId}, contacts: ${contactIds.join(", ")}`)

    const vexaApiKey = await storage.get("vexaApiKey")
    const hubspotToken = await storage.get("hubspotAccessToken")

    if (!vexaApiKey || !hubspotToken) {
      const errorMsg = "Vexa API Key or HubSpot Token not found."
      console.error("Vexa-Hubspot:", errorMsg)
      sendResponse({ success: false, error: errorMsg })
      return
    }

    // --- 1. Fetch Transcript from Vexa (Simulated for now) ---
    // In a real scenario, you would call the Vexa API GET /transcripts/{platform}/{native_meeting_id}
    // const transcriptData = await fetchVexaTranscript(meetingId, vexaApiKey);
    // if (!transcriptData.success) {
    //   sendResponse({ success: false, error: transcriptData.error });
    //   return;
    // }
    // const transcriptText = formatTranscriptForHubspot(transcriptData.data);
    
    // For now, using placeholder transcript text:
    const transcriptText = `This is a simulated transcript for meeting ID: ${meetingId}.\n\nSpeaker 1: Hello everyone.\nSpeaker 2: Good to be here.\nSpeaker 1: Let's discuss the project updates.`
    console.log("Using simulated transcript:", transcriptText)

    // --- 2. Log Call to HubSpot ---
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

// Placeholder function - replace with actual Vexa API call later
// async function fetchVexaTranscript(meetingId: string, apiKey: string) { 
//   console.log(`Fetching Vexa transcript for meeting: ${meetingId}`);
//   // Actual API call logic here
//   return { success: true, data: { /* ... transcript ... */ } };
// }

// Placeholder function - replace with actual formatting if needed
// function formatTranscriptForHubspot(transcriptData: any): string {
//   // Format transcriptData into a readable string
//   return JSON.stringify(transcriptData, null, 2); 
// }

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