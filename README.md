# Vexa-Hubspot Google Meet Integration (Chrome Extension)

This Chrome extension seamlessly integrates [Vexa.ai](https://vexa.ai) real-time transcription services for Google Meet with Hubspot, allowing users to automatically send a Vexa bot to their meetings, search for Hubspot contacts to associate with the meeting, and log the meeting transcript to Hubspot upon completion.

## Features

*   **Automatic Vexa Bot Deployment**: Detects active Google Meet calls and automatically sends a Vexa transcription bot using your Vexa API key.
*   **Hubspot Contact Association**: Allows searching and selecting Hubspot contacts (and potentially deals) to link with the ongoing meeting.
*   **Automated Transcript Logging**: Retrieves the meeting transcript from Vexa once the meeting concludes and logs it as an engagement (e.g., Note or Call) in Hubspot, associated with the chosen contacts/deals.
*   **Real-time Status Updates**: Provides feedback to the user on the bot's status, transcription progress, and Hubspot logging.

## Tech Stack

*   **Frontend**: React
*   **Styling**: Tailwind CSS
*   **UI Components**: ShadCN/UI (To be added)
*   **Chrome Extension Framework**: Plasmo
*   **Build Tool**: pnpm (managed by Plasmo)
*   **Language**: TypeScript

## Prerequisites

1.  **Vexa API Key**: You will need an active Vexa API key. You can obtain one from [www.vexa.ai](https://www.vexa.ai).
2.  **Hubspot Account**: Access to a Hubspot account with API access permissions to search contacts and log engagements.

## Getting Started (with Plasmo)

1.  **Clone the repository (if you haven't already):**
    ```bash
    # git clone <repository-url>
    # cd vexa-hubspot-extension
    ```

2.  **Install dependencies (Plasmo uses pnpm by default):**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```

4.  **Load the extension in Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode".
    *   Click "Load unpacked" and select the `build/chrome-mv3-dev` directory.

5.  **Set up environment variables for Vexa API Key:**
    Create a `.env` file in the root directory (e.g., `touch .env`). Plasmo uses `dotenv` integration.
    Add your Vexa API key:
    ```env
    PLASMO_PUBLIC_VEXA_API_KEY=your_vexa_api_key_here
    ```
    *Note: For Hubspot authentication, OAuth 2.0 will be used. The extension will guide you through the Hubspot login process later.*

## How to Use

(To be detailed as features are implemented)

1.  Ensure the extension is loaded and you've configured your Vexa API key.
2.  Join a Google Meet call.
3.  Use the extension's popup for interactions (Hubspot login, contact search, etc.).

## Project Structure (Plasmo based)

Plasmo has a convention-over-configuration approach. Key files often include:

```
/
├── assets/                     # Static assets like icons
├── popup.tsx                   # Main React component for the extension popup
├── content.ts                  # Content script for Google Meet page interaction
├── background.ts               # Background service worker for API calls, event handling
├── options.tsx                 # Optional: for an extension options page
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

*This project aims to leverage the power of Vexa.ai for transcription and Hubspot for CRM integration to streamline post-meeting workflows.*
 