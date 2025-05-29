import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://meet.google.com/*"],
  run_at: "document_idle", // Run when the DOM is complete
}

console.log("Vexa-Hubspot content script loaded on Google Meet page.")

let currentMeetingId: string | null = null
let meetingStartTime: number | null = null

const getMeetingIdFromUrl = (url: string): string | null => {
  const match = url.match(/^https:\/\/meet\.google\.com\/([a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

const checkForMeeting = () => {
  const newMeetingId = getMeetingIdFromUrl(window.location.href)

  if (newMeetingId && newMeetingId !== currentMeetingId) {
    // Meeting started
    currentMeetingId = newMeetingId
    meetingStartTime = Date.now()
    console.log("Vexa-Hubspot: Google Meet detected. Meeting ID:", currentMeetingId)
    
    // Send to background script
    chrome.runtime.sendMessage(
      { type: "MEETING_STARTED", meetingId: currentMeetingId },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Vexa-Hubspot: Error sending MEETING_STARTED message:",
            chrome.runtime.lastError.message
          )
        } else {
          console.log("Vexa-Hubspot: MEETING_STARTED message sent, response:", response)
        }
      }
    )
  } else if (!newMeetingId && currentMeetingId) {
    // Meeting ended
    const endedMeetingId = currentMeetingId
    const meetingDuration = meetingStartTime ? Date.now() - meetingStartTime : 0
    
    console.log("Vexa-Hubspot: Meeting ended. ID:", endedMeetingId, "Duration:", meetingDuration + "ms")
    
    // Send meeting ended message
    chrome.runtime.sendMessage(
      { 
        type: "MEETING_ENDED", 
        meetingId: endedMeetingId,
        duration: meetingDuration
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Vexa-Hubspot: Error sending MEETING_ENDED message:",
            chrome.runtime.lastError.message
          )
        } else {
          console.log("Vexa-Hubspot: MEETING_ENDED message sent, response:", response)
        }
      }
    )
    
    // Reset state
    currentMeetingId = null
    meetingStartTime = null
  }
}

// Initial check
checkForMeeting()

// Monitor URL changes (e.g., navigating within meet.google.com or joining/leaving meetings)
// Google Meet uses single-page application principles, so a simple interval or MutationObserver might be best.
// For simplicity now, we'll rely on the initial check and potential re-injection if the user navigates to a new meet URL.
// A more robust solution would use MutationObserver to detect SPA navigations.

// Basic interval check for URL changes, as SPA navigation won't trigger a full page load always.
const intervalId = setInterval(checkForMeeting, 3000) // Check every 3 seconds

// Clean up the interval when the content script is unloaded (e.g., tab closed)
window.addEventListener("unload", () => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  
  // If there's an active meeting when the page unloads, send a meeting ended message
  if (currentMeetingId) {
    chrome.runtime.sendMessage({
      type: "MEETING_ENDED",
      meetingId: currentMeetingId,
      duration: meetingStartTime ? Date.now() - meetingStartTime : 0
    })
  }
})

// Example of how to listen for messages from popup or background (if needed later)
/*
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  if (message.action === "GET_MEETING_ID") {
    sendResponse({ meetingId: currentMeetingId });
  }
  return true; // Keep the message channel open for asynchronous response
});
*/ 