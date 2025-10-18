# ChatterBox: AI Voice & Text Conversion Studio 

[](https://www.google.com/search?q=https://shahvez-khan.github.io/ChatterBox/)
[](https://github.com/shahvez-khan/ChatterBox)
[](https://opensource.org/licenses/MIT)

A modern, front-end web application for professional-grade **Text-to-Speech (TTS)** generation and accurate **Speech-to-Text (STT)** transcription services. The project is designed for deployment as a static site and implements a robust security pattern to protect API keys.

-----

## ✨ Features

### Text-to-Speech (TTS)

  * **AI Model:** Utilizes the Google Gemini API (`gemini-2.5-flash-preview-tts`) for high-fidelity voice synthesis.
  * **Voice Library:** Provides multiple prebuilt voice options (e.g., Kore, Puck, Zephyr, Charon).
  * **Output:** Generates and allows download of audio files in WAV format.

### Speech-to-Text (STT)

  * **Real-time Transcription:** Captures spoken input via the user's microphone and transcribes it in real-time.
  * **Browser API:** Built upon the native `webkitSpeechRecognition` API.
  * **Output:** Transcriptions are presented in an editable text area and are downloadable as a TXT file.

### Design & Architecture

  * **Front-End:** Pure HTML, CSS, and Vanilla JavaScript.
  * **Styling:** A sleek, dark-mode professional aesthetic is achieved using the **Tailwind CSS** framework.

-----

## 🛠️ Installation & Local Development

This is a static front-end application that does not require a build process. It only requires a valid Gemini API Key for the TTS functionality.

### 1\. API Key Setup (Security Protocol)

The API key must be available for the application to function, but it cannot be committed to the public repository.

1.  **Git Ignore:** The repository uses a **`.gitignore`** file to exclude `secrets.js` from all commits.
2.  **Local File Creation:** In the root directory of the project, create a file named **`secrets.js`** and paste your live API key into it:
    ```javascript
    // secrets.js
    const CHATTERBOX_API_KEY = "YOUR_LIVE_GEMINI_API_KEY_HERE"; 
    ```
    (Note: The main `script.js` file expects and uses the `CHATTERBOX_API_KEY` variable from this file.)
3.  **Local Run:** Open the `index.html` file directly in your web browser.

### 2\. Project Clone (If cloning this repo)

```bash
# Clone the repository
git clone https://github.com/shahvez-khan/ChatterBox.git

# Navigate to the project directory
cd ChatterBox

# Perform API Key Setup (Step 1)
```

-----

## 🌐 Deployment to GitHub Pages

To make the live site fully functional, the API key file must be present on the web host.

1.  **Enable GitHub Pages:**

      * On the GitHub repository page, navigate to **Settings** \> **Pages**.
      * Set **Source** to **`Deploy from a branch`**.
      * Set **Branch** to **`main`** and the folder to **`/` (root)**. Click **Save**.

2.  **Manual Upload of `secrets.js`:**

      * Once the repository is deployed, upload the local **`secrets.js`** file directly to the root of the `main` branch via the GitHub web interface.
      * This critical step bypasses the Git history while making the key available to the live environment.

### Live Site:

The live version of this application is hosted here:

> [https://shahvez-khan.github.io/ChatterBox/](https://www.google.com/search?q=https://shahvez-khan.github.io/ChatterBox/)

-----

## 📜 License

This project is licensed under the MIT License.

The MIT License is a permissive free software license, meaning it allows reuse for any purpose, subject to the condition that the copyright and permission notice is preserved.
