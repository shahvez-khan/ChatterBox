This is a comprehensive `README.md` file you can use for your `shahvez-khan/ChatterBox` repository. You can create a new file named `README.md` in the root of your repository and paste this content into it.

-----

# ChatterBox: AI Voice & Text Conversion Service 🗣️

[](https://www.google.com/url?sa=E&source=gmail&q=https://shahvez-khan.github.io/ChatterBox/)
[](https://github.com/shahvez-khan/ChatterBox)
[](https://opensource.org/licenses/MIT)

## 🌟 Overview

**ChatterBox** is a modern, pure front-end web application that provides high-fidelity **Text-to-Speech (TTS)** generation and accurate **Speech-to-Text (STT)** transcription services. This project demonstrates effective integration of advanced AI capabilities within a professional, dark-themed user interface.

The application is designed to be fully deployable as a static site (e.g., via GitHub Pages), with a robust security mechanism implemented to protect sensitive API keys.

## ✨ Key Features

  * **Text-to-Speech (TTS) Generation:** Produce natural, human-like voiceovers from any text input.
  * **High-Fidelity Audio:** Utilizes the `gemini-2.5-flash-preview-tts` model for voice synthesis.
  * **Voice Control:** Allows selection of various prebuilt voice options (e.g., Kore, Puck, Zephyr, Charon).
  * **Speech-to-Text (STT) Transcription:** Captures spoken words from the microphone and accurately transcribes them in real-time.
  * **Downloadable Output:** Users can download generated audio as a WAV file and transcribed text as a TXT file.
  * **Responsive Design:** Styled using **Tailwind CSS** for a sleek, dark-mode professional interface.

## 🛠️ Technology Stack

  * **Front-End:** HTML5, CSS3, JavaScript (Vanilla JS)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/) (loaded via CDN)
  * **TTS API:** Google Gemini API (`gemini-2.5-flash-preview-tts`)
  * **STT API:** Browser's native `webkitSpeechRecognition` API

## ⚙️ Local Setup and API Key Security

This project requires a Gemini API Key to run the Text-to-Speech functionality. The key is secured in a local file (`secrets.js`) that is ignored by Git.

### Prerequisites

1.  A valid Gemini API Key.
2.  Node.js and npm (recommended, but not strictly required for this front-end app).

### 1\. Secure Setup

Since the API key is secured via a `.gitignore` file, you need to manually re-create the file locally to run the app:

1.  **Create `secrets.js`:** In the root directory (`Text_Speech`), create a file named `secrets.js` and paste your key inside:

    ```javascript
    // secrets.js (DO NOT ADD TO GIT)
    const CHATTERBOX_API_KEY = "YOUR_LIVE_GEMINI_API_KEY_HERE"; 
    ```

2.  **Verify Code:** The `index.html` file should include the script tag for `secrets.js`, and the `script.js` file should reference the variable `CHATTERBOX_API_KEY`. (If you followed the security steps in the chat, this is already done.)

### 2\. Run Locally

Open the `Text_Speech/index.html` file directly in your web browser. The app should load and be fully functional for local testing.

## 🌐 Deployment (GitHub Pages)

To host your project live on GitHub Pages, follow these critical steps to ensure security and functionality:

1.  **Enable GitHub Pages:**

      * Go to your repository **Settings** tab on GitHub.
      * Click **Pages** in the sidebar.
      * Under "Build and deployment," set **Source** to **`Deploy from a branch`**.
      * Set **Branch** to **`main`** and the folder to **`/` (root)**, then click **Save**.

2.  **Manually Upload `secrets.js` (CRITICAL STEP):**

      * Since Git ignores this file, you must upload it directly to the live environment for the TTS feature to work.
      * Go to the **Code** tab of your repository.
      * Click **`Add file`** -\> **`Upload files`**.
      * Drag and drop your local `secrets.js` file.
      * **Crucially, ensure you commit the change directly to the `main` branch** (do not create a pull request).

Your site will be live at `https://shahvez-khan.github.io/ChatterBox/` after a few minutes\!

## 📜 License

This project is licensed under the MIT License - see the LICENSE file (if created) for details.
