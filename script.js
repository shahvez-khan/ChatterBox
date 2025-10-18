// Global variable to store the generated audio blob for downloading
let globalAudioBlob = null; 
let recognition = null; // Speech Recognition instance
let isSpeaking = false;
// SECURITY FIX: The apiKey is set to an empty string. 
// The Canvas environment securely provides the key at runtime for API calls.
const apiKey = CHATTERBOX_API_KEY;

// FIX ADDED: Array to hold references to Audio objects currently playing
let activeAudioPlayers = []; 

// Supported Voices for Gemini TTS API
const GEMINI_TTS_VOICES = [
    { name: "Kore (Firm)", value: "Kore" },
    { name: "Puck (Upbeat)", value: "Puck" },
    { name: "Zephyr (Bright)", value: "Zephyr" },
    { name: "Charon (Informative)", value: "Charon" },
    { name: "Fenrir (Excitable)", value: "Fenrir" },
    // Add more voices as needed
];

// Element selection
const voiceSelect = document.getElementById('voice-select');
const ttsTextarea = document.getElementById('tts-text');
const speakBtn = document.getElementById('speak-btn');
const stopBtn = document.getElementById('stop-btn');
const rateSlider = document.getElementById('rate');
const pitchSlider = document.getElementById('pitch');
const rateValueSpan = document.getElementById('rate-value');
const pitchValueSpan = document.getElementById('pitch-value');
const sttOutput = document.getElementById('stt-output');
const sttStatus = document.getElementById('stt-status');
const startSttBtn = document.getElementById('start-stt-btn');
const sttWarning = document.getElementById('stt-warning');
const downloadAudioBtn = document.getElementById('download-audio-btn');
const downloadTranscriptBtn = document.getElementById('download-transcript-btn');
const ttsStatusMsg = document.getElementById('tts-status-msg');
// New format selector element
const formatSelect = document.getElementById('format-select'); 

// Navigation elements (for view switching)
const navHomeBtn = document.getElementById('nav-home-btn');
const navConverterBtn = document.getElementById('nav-converter-btn');
const homeStartBtn = document.getElementById('home-start-btn');
const homeView = document.getElementById('home-view');
const converterView = document.getElementById('converter-view');

// NEW: Footer and Logo Navigation Elements
const logoBtn = document.getElementById('logo-btn'); 
const navPricingBtn = document.getElementById('nav-pricing-btn');
const navApiBtn = document.getElementById('nav-api-btn');
const navSupportBtn = document.getElementById('nav-support-btn');
const navLegalBtn = document.getElementById('nav-legal-btn');

const pricingView = document.getElementById('pricing-view');
const apiDocsView = document.getElementById('api-docs-view');
const supportView = document.getElementById('support-view');
const legalView = document.getElementById('legal-view');


// --- TTS API Audio Processing Functions ---

/**
 * Converts a base64 string to an ArrayBuffer.
 * @param {string} base64 The base64 encoded string.
 * @returns {ArrayBuffer} The ArrayBuffer.
 */
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Converts raw PCM audio data (Int16Array) into a WAV Blob.
 * @param {Int16Array} pcm16 Raw 16-bit signed PCM audio data.
 * @param {number} sampleRate The sample rate of the PCM data.
 * @returns {Blob} The audio Blob in WAV format.
 */
function pcmToWav(pcm16, sampleRate) {
    // 44 bytes for WAV header + 2 bytes per sample (Int16)
    const buffer = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(buffer);
    let offset = 0;

    function writeString(s) {
        for (let i = 0; i < s.length; i++) {
            view.setUint8(offset++, s.charCodeAt(i));
        }
    }

    function writeUint32(i) {
        view.setUint32(offset, i, true);
        offset += 4;
    }

    function writeUint16(i) {
        view.setUint16(offset, i, true);
        offset += 2;
    }

    // RIFF chunk descriptor
    writeString('RIFF');
    writeUint32(36 + pcm16.length * 2); // File size - 8
    writeString('WAVE');

    // FMT sub-chunk
    writeString('fmt ');
    writeUint32(16); // Sub-chunk size (16 for PCM)
    writeUint16(1); // Audio format (1 for PCM)
    writeUint16(1); // Number of channels (Mono)
    writeUint32(sampleRate); // Sample rate
    writeUint32(sampleRate * 2); // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
    writeUint16(2); // Block align (NumChannels * BitsPerSample/8)
    writeUint16(16); // Bits per sample (16)

    // DATA sub-chunk
    writeString('data');
    writeUint32(pcm16.length * 2); // Data size

    // Write PCM data
    for (let i = 0; i < pcm16.length; i++) {
        // Write signed 16-bit integer
        view.setInt16(offset, pcm16[i], true); 
        offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
}

// --- Core TTS Logic ---

/**
 * Fetches audio from Gemini TTS API, plays it, and enables download.
 */
async function speakText() {
    if (isSpeaking) return;
    
    const text = ttsTextarea.value.trim();
    if (!text) {
        ttsStatusMsg.textContent = "Please enter text to generate audio.";
        ttsStatusMsg.classList.add('text-error-red');
        return;
    }

    const voiceName = voiceSelect.value || "Kore"; 
    
    // Reset state
    isSpeaking = true;
    speakBtn.textContent = 'Generating...';
    speakBtn.disabled = true;
    stopBtn.disabled = true;
    downloadAudioBtn.disabled = true;
    ttsStatusMsg.textContent = 'Generating high-fidelity audio...';
    ttsStatusMsg.classList.remove('text-error-red');
    ttsStatusMsg.classList.add('text-primary-neon');
    globalAudioBlob = null;

    const payload = {
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName }
                }
            }
        },
        model: "gemini-2.5-flash-preview-tts"
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    
    try {
        let response;
        // Retry logic with exponential backoff
        for (let i = 0; i < 3; i++) {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) break;
            
            if (i < 2) { // Only retry if not on the last attempt
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
        }
        
        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/")) {
            const rateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
            
            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            const wavBlob = pcmToWav(pcm16, sampleRate);
            
            globalAudioBlob = wavBlob; 
            downloadAudioBtn.disabled = false; 

            const audioUrl = URL.createObjectURL(wavBlob);
            const audio = new Audio(audioUrl);

            // FIX: Add the new audio player to the list of active players
            activeAudioPlayers.push(audio);
            
            audio.onended = () => {
                // FIX: Remove this player from the list when it naturally ends and revoke the URL
                activeAudioPlayers = activeAudioPlayers.filter(p => p !== audio);
                URL.revokeObjectURL(audioUrl); 
                stopSpeaking(false); // Finished playing, but keep download enabled
            };
            
            audio.play();
            stopBtn.disabled = false;
            speakBtn.textContent = 'Playing...';
            ttsStatusMsg.textContent = 'Audio playback started.';
            ttsStatusMsg.classList.remove('text-error-red');
            ttsStatusMsg.classList.add('text-primary-neon');

        } else {
            throw new Error("Invalid audio response structure from API.");
        }

    } catch (error) {
        console.error("TTS Generation Error:", error);
        stopSpeaking(false); // Stop UI changes but don't re-enable speak button yet
        speakBtn.textContent = 'Preview Audio';
        speakBtn.disabled = false;
        ttsStatusMsg.textContent = `Error: Failed to generate audio. ${error.message}`;
        ttsStatusMsg.classList.add('text-error-red');
    } finally {
         // Ensure the "Generating..." state is cleaned up
         isSpeaking = false;
         speakBtn.disabled = false;
         // Update the button text after final state change
         updateDownloadButtonText(); 
    }
}

/**
 * Stops current audio playback and resets state.
 * @param {boolean} resetDownload Optional. If true, disables the download button. Defaults to true.
 */
function stopSpeaking(resetDownload = true) {
    // FIX: Stop all actively tracked audio players and clear the array
    activeAudioPlayers.forEach(audio => {
        audio.pause();
        // Reset the time to 0 to truly "stop" it
        audio.currentTime = 0; 
    });
    
    // Clear the list of active players
    activeAudioPlayers = [];

    isSpeaking = false;
    speakBtn.textContent = 'Preview Audio';
    speakBtn.disabled = false;
    stopBtn.disabled = true;
    
    // Only update message/download button if audio was actually played/generated
    if (globalAudioBlob || resetDownload) {
        ttsStatusMsg.classList.remove('text-error-red', 'text-primary-neon');
        
        if (resetDownload) {
            ttsStatusMsg.textContent = 'Audio conversion studio ready.';
            downloadAudioBtn.disabled = true;
            globalAudioBlob = null;
            updateDownloadButtonText();
        } else if (globalAudioBlob) {
             // Keep download enabled if audio was successfully generated
             ttsStatusMsg.textContent = 'Audio ready for download.';
             ttsStatusMsg.classList.add('text-primary-neon');
             updateDownloadButtonText(); 
        }
    }
}

// --- Download Functions ---

/**
 * Triggers the download of the globally stored audio blob.
 */
function downloadAudio() {
    if (!globalAudioBlob) {
        ttsStatusMsg.textContent = "Error: No audio file generated yet.";
        ttsStatusMsg.classList.add('text-error-red');
        return;
    }
    
    const selectedFormat = formatSelect.value;
    const fileExtension = selectedFormat === 'mp3' ? 'wav' : 'wav'; // Always download WAV internally
    const targetExtension = selectedFormat === 'mp3' ? 'mp3' : 'wav';
    const fileName = `chatterbox_voiceover_${Date.now()}.${targetExtension}`;

    const url = URL.createObjectURL(globalAudioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    let message = `**${targetExtension.toUpperCase()}** file download initiated.`;
    
    if (selectedFormat === 'mp3') {
         message += ' (Note: File is currently **WAV**. Use an online converter like <a href="https://online-audio-converter.com/" target="_blank" class="text-primary-neon underline">online-audio-converter.com</a> to convert to MP3)';
    }
    
    ttsStatusMsg.innerHTML = message;
    ttsStatusMsg.classList.add('text-primary-neon');
}

/**
 * Updates the download button text based on the selected format.
 */
function updateDownloadButtonText() {
    const format = formatSelect.value.toUpperCase();
    downloadAudioBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        **Download ${format} Audio File**
    `;
}

/**
 * Triggers the download of the STT transcript as a TXT file.
 */
function downloadTxt() {
    const text = sttOutput.value;
    if (!text) {
        sttStatus.innerHTML = '<span class="text-error-red">Error: Transcription output is empty.</span>';
        return;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'chatterbox_transcript_' + Date.now() + '.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    sttStatus.innerHTML = '<span class="text-primary-neon">Transcript download initiated.</span>';
}

// --- Speech-to-Text (STT) Logic ---

/**
 * Initializes and toggles the STT service.
 */
function toggleSTT() {
    if (!('webkitSpeechRecognition' in window)) {
        sttStatus.innerHTML = '<span class="text-error-red">Error: Speech Recognition not supported in this browser.</span>';
        sttWarning.classList.remove('hidden');
        return;
    }

    if (recognition && recognition.isListening) {
        recognition.stop();
        return;
    }

    if (!recognition) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true; // Keep listening until manually stopped
        recognition.interimResults = true; // Show results as they come in
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            recognition.isListening = true;
            startSttBtn.textContent = 'Stop Listening';
            startSttBtn.classList.remove('btn-primary');
            startSttBtn.classList.add('btn-stop');
            sttStatus.innerHTML = '<span class="text-primary-neon">Listening... Speak now.</span>';
        };

        recognition.onend = () => {
            recognition.isListening = false;
            startSttBtn.textContent = 'Start Transcription';
            startSttBtn.classList.add('btn-primary');
            startSttBtn.classList.remove('btn-stop');
            sttStatus.innerHTML = '<span class="text-gray-400">Recording finished.</span>';
            if (sttOutput.value.trim().length > 0) {
                downloadTranscriptBtn.disabled = false;
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event);
            sttStatus.innerHTML = `<span class="text-error-red">Error: ${event.error}</span>`;
            recognition.isListening = false;
            startSttBtn.textContent = 'Start Transcription';
            startSttBtn.classList.add('btn-primary');
            startSttBtn.classList.remove('btn-stop');
        };
        
        let finalTranscript = '';
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + '. ';
                } else {
                    interimTranscript += transcript;
                }
            }
            // Display final transcript plus the current interim result
            sttOutput.value = finalTranscript + interimTranscript;
            sttOutput.scrollTop = sttOutput.scrollHeight;
        };
    }

    // Start listening
    try {
        recognition.start();
    } catch (e) {
        console.error('Recognition start failed:', e);
        sttStatus.innerHTML = '<span class="text-error-red">Recording failed. Microphone access denied or in use.</span>';
    }
}


// --- Initialization and Event Listeners ---

function initialize() {
    // Populate Voice Select dropdown
    GEMINI_TTS_VOICES.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.value;
        option.textContent = voice.name;
        voiceSelect.appendChild(option);
    });

    // Set default view
    showView('home-view');
    
    // SLIDER EVENT LISTENERS
    rateSlider.addEventListener('input', () => {
        rateValueSpan.textContent = rateSlider.value;
        // Note: Rate is managed by the client-side SpeechSynthesis for preview purposes only
    });
    pitchSlider.addEventListener('input', () => {
        pitchValueSpan.textContent = pitchSlider.value;
        // Note: Pitch is managed by the client-side SpeechSynthesis for preview purposes only
    });
    
    // FORMAT SELECT LISTENER (NEW)
    formatSelect.addEventListener('change', () => {
        updateDownloadButtonText();
        if (globalAudioBlob) {
            // If audio is already generated, update the status message
            const format = formatSelect.value.toUpperCase();
            let message = `Audio ready for download as ${format}.`;
            if (format === 'MP3') {
                message += ' (Note: Actual file is WAV for external conversion.)';
            }
            ttsStatusMsg.innerHTML = message;
            ttsStatusMsg.classList.add('text-primary-neon');
        }
    });

    // BUTTON LISTENERS
    speakBtn.addEventListener('click', speakText);
    stopBtn.addEventListener('click', stopSpeaking);
    startSttBtn.addEventListener('click', toggleSTT);
    downloadAudioBtn.addEventListener('click', downloadAudio); // Function renamed to handle format logic
    downloadTranscriptBtn.addEventListener('click', downloadTxt); 

    // NAVIGATION LISTENERS (Header buttons and Home button)
navHomeBtn.addEventListener('click', (e) => { e.preventDefault(); showView('home-view'); });
   navConverterBtn.addEventListener('click', (e) => { e.preventDefault(); showView('converter-view'); });
   homeStartBtn.addEventListener('click', (e) => { e.preventDefault(); showView('converter-view'); });
    
    // NEW NAVIGATION LISTENERS (Footer links and Logo)
    if (logoBtn) {
        logoBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link jump
            showView('home-view');
        });
    }

    if (navPricingBtn) navPricingBtn.addEventListener('click', (e) => { e.preventDefault(); showView('pricing-view'); });
    if (navApiBtn) navApiBtn.addEventListener('click', (e) => { e.preventDefault(); showView('api-docs-view'); });
    if (navSupportBtn) navSupportBtn.addEventListener('click', (e) => { e.preventDefault(); showView('support-view'); });
    if (navLegalBtn) navLegalBtn.addEventListener('click', (e) => { e.preventDefault(); showView('legal-view'); });
}

/**
 * Handles switching between the home and converter views.
 * @param {string} viewId The ID of the view to show ('home-view' or 'converter-view').
 */
function showView(viewId) {
    // Hide all view containers
    const allViews = [homeView, converterView, pricingView, apiDocsView, supportView, legalView];
    allViews.forEach(view => {
        if (view) view.classList.add('hidden');
    });

    // Show the selected view
    let selectedView;
    switch (viewId) {
        case 'home-view':
            selectedView = homeView;
            break;
        case 'converter-view':
            selectedView = converterView;
            break;
        case 'pricing-view':
            selectedView = pricingView;
            break;
        case 'api-docs-view':
            selectedView = apiDocsView;
            break;
        case 'support-view':
            selectedView = supportView;
            break;
        case 'legal-view':
            selectedView = legalView;
            break;
        default:
            selectedView = homeView; // Default to home
            break;
    }
    
    if (selectedView) {
        selectedView.classList.remove('hidden');
    }
    
    // Ensure no audio is playing when switching away from the converter
    if (viewId !== 'converter-view') {
        stopSpeaking(true); 
    }
}

window.onload = initialize;
