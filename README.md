# Vexa-Hubspot Google Meet Integration (Chrome Extension)

This Chrome extension seamlessly integrates [Vexa.ai](https://vexa.ai) real-time transcription services for Google Meet with HubSpot, allowing users to:
*   Automatically have a Vexa transcription bot join their Google Meet calls.
*   Search for HubSpot contacts directly within the extension popup.
*   Associate selected HubSpot contacts with the active Google Meet.
*   Log the meeting (including the Vexa transcript) to associated HubSpot contacts as a call engagement upon request.

## Development Stream

This extension was initially kick-started during a 2-hour live vibe coding stream! The goal was to begin automating Google Meet workflows with Vexa.ai transcription and HubSpot CRM integration, paving the way for further automation flows.

Watch the stream here: [Vibe Coding - Google Meet & HubSpot Automation with Vexa.ai](https://www.youtube.com/watch?v=oH1Qs-4p4Es)

## Features

*   **Automatic Vexa Bot Deployment**: Detects active Google Meet calls and, if a Vexa API key is configured, attempts to deploy a Vexa transcription bot.
*   **HubSpot Contact Association**: Allows searching and selecting HubSpot contacts via the extension popup to link them with the ongoing Google Meet.
*   **Manual Transcript Logging**: On-demand logging of the Google Meet (using the Vexa transcript) as a call engagement to the associated HubSpot contacts.
*   **Real-time Status Updates**: Provides feedback within the popup on API key status, active meeting detection, contact search, and HubSpot logging.
*   **Secure Credential Storage**: Uses `chrome.storage.local` for storing Vexa API Key and HubSpot Access Token.

## Tech Stack

*   **Frontend**: React (TypeScript)
*   **Chrome Extension Framework**: Plasmo
*   **Build Tool**: pnpm (managed by Plasmo)
*   **Language**: TypeScript

## Prerequisites

1.  **Vexa API Key**: Obtain your Vexa API key from your dashboard at [https://vexa.ai/dashboard/api-keys](https://vexa.ai/dashboard/api-keys).
2.  **HubSpot Private App Access Token**: To get this token, navigate in your HubSpot account to:
    *   Settings → Integrations → Private Apps.
    *   Click "Create a private app".
    *   Configure the basic info for your app.
    *   Under the "Scopes" tab, ensure you grant at least the following permissions:
        *   `crm.objects.contacts.read`
        *   `crm.objects.contacts.write`
    *   After setting the scopes and creating the app, HubSpot will provide an Access Token. Copy this token.

## Getting Started (For Developers)

The following steps are for developers who want to build the extension from source or contribute to its development. If you just want to use the extension, please see the "Installing Pre-built Extension" section below.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Vexa-ai/gmeet-vexa-hubspot-integration.git
    cd gmeet-vexa-hubspot-integration
    ```

2.  **Install dependencies (Plasmo uses pnpm by default):**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    This will build the extension and watch for changes.

4.  **Load the extension in Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" (usually a toggle in the top right).
    *   Click "Load unpacked".
    *   Select the `build/chrome-mv3-dev` directory from this project.

## Installing Pre-built Extension (Recommended for Users)

If you don't want to set up the development environment, you can install a pre-built version of the extension:

1.  **Download the latest release:** Go to the [GitHub Releases page](https://github.com/Vexa-ai/gmeet-vexa-hubspot-integration/releases) for this project. Download the `gmeet-vexa-hubspot-extension-v0.0.1.zip` file (or the latest version available).
2.  **Unzip the file:** Extract the contents of the downloaded ZIP file to a permanent folder on your computer (e.g., `gmeet-vexa-hubspot-extension`).
3.  **Load the extension in Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Ensure "Developer mode" (usually a toggle in the top right) is enabled.
    *   Click the "Load unpacked" button.
    *   Select the folder where you unzipped the extension files (e.g., the `gmeet-vexa-hubspot-extension` folder you created in step 2).

The extension icon should now appear in your Chrome toolbar.

## Configuration & How to Use

1.  **Open the Extension Popup:** Once loaded, click the extension's icon in your Chrome toolbar.
2.  **Configure API Keys:**
    *   **Vexa API Key**: Enter your Vexa API key in the designated field and click "Save Vexa API Key".
    *   **HubSpot Access Token**: Enter your HubSpot Private App Access Token in its field and click "Save HubSpot Token". You can use the "Test Token" button to verify its validity and required permissions.
    *   The extension will store these keys securely in local browser storage.
3.  **Join a Google Meet Call:** Start or join any Google Meet.
    *   The extension's content script will detect the meeting.
    *   The background script will attempt to deploy the Vexa bot if the Vexa API key is valid.
4.  **Use the Popup for an Active Meeting:**
    *   Open the popup. It should display the ID of the active Google Meet.
    *   **Search Contacts**: Use the search bar to find HubSpot contacts by name or email.
    *   **Associate Contacts**: Click on contacts from the search results to select (associate) them with the current meeting. Selected contacts will be highlighted, and a count will be shown. These associations are remembered for the current meeting session.
    *   **Log to HubSpot**: Once you have at least one contact associated, the "Log Call to HubSpot" button will become active. Clicking this will:
        *   Retrieve the transcript from Vexa for the current meeting.
        *   Create a "Call" engagement in HubSpot.
        *   Associate this engagement with all the selected HubSpot contacts.
        *   The body of the call engagement will contain the meeting transcript.
5.  **Meeting End:**
    *   When you leave the Google Meet or the tab is closed, the active meeting session is cleared in the background.

## Project Structure (Plasmo based)

Plasmo has a convention-over-configuration approach. Key files:

```
/
├── assets/                     # Static assets like icons (e.g., extension icon)
├── popup.tsx                   # Main React component for the extension popup UI and logic
├── content.ts                  # Content script injected into Google Meet pages to detect meeting details
├── background.ts               # Background service worker for Vexa/HubSpot API calls, message handling, and session management
├── tailwind.config.js          # (If used) Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Project metadata and dependencies
├── pnpm-lock.yaml              # pnpm lockfile
└── README.md                   # This file
```

## Contributing

Contributions are welcome! Please open an issue to discuss an idea or submit a pull request for bug fixes or features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This project aims to leverage the power of Vexa.ai for transcription and HubSpot for CRM integration to streamline post-meeting workflows.*
 