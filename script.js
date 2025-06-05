document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeBtn = document.getElementById('themeBtn');
    const textInput = document.getElementById('textInput');
    const ssmlInput = document.getElementById('ssmlInput');
    const ssmlPreview = document.getElementById('ssmlPreview');
    const languageSelect = document.getElementById('languageSelect');
    const voiceSelect = document.getElementById('voiceSelect');
    const rateControl = document.getElementById('rateControl');
    const pitchControl = document.getElementById('pitchControl');
    const rateValue = document.getElementById('rateValue');
    const pitchValue = document.getElementById('pitchValue');
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const ssmlTools = document.querySelectorAll('.ssml-tool');
    
    // Speech Synthesis
    const synth = window.speechSynthesis;
    let voices = [];
    let currentUtterance = null;
    let mediaRecorder;
    let audioChunks = [];
    
    // Initialize the app
    init();
    
    function init() {
        // Load theme preference
        loadTheme();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load voices
        loadVoices();
        
        // If voices aren't immediately available, listen for changes
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
        
        // Initialize SSML preview
        updateSsmlPreview();
    }
    
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }
    
    function updateThemeIcon(theme) {
        const icon = themeBtn.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    function setupEventListeners() {
        // Theme toggle
        themeBtn.addEventListener('click', toggleTheme);
        
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // SSML preview update
        ssmlInput.addEventListener('input', updateSsmlPreview);
        
        // Range controls
        rateControl.addEventListener('input', () => {
            rateValue.textContent = rateControl.value;
        });
        
        pitchControl.addEventListener('input', () => {
            pitchValue.textContent = pitchControl.value;
        });
        
        // Language change
        languageSelect.addEventListener('change', updateVoiceList);
        
        // Play button
        playBtn.addEventListener('click', playText);
        
        // Stop button
        stopBtn.addEventListener('click', stopPlayback);
        
        // Download button
        downloadBtn.addEventListener('click', downloadAudio);
        
        // SSML tools
        ssmlTools.forEach(tool => {
            tool.addEventListener('click', () => insertSsmlTag(
                tool.dataset.tag, 
                tool.dataset.params
            ));
        });
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }
    
    function switchTab(tabName) {
        // Update active tab button
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update active tab content
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }
    
    function loadVoices() {
        voices = synth.getVoices();
        updateVoiceList();
    }
    
    function updateVoiceList() {
        const selectedLanguage = languageSelect.value;
        voiceSelect.innerHTML = '';
        
        // Filter voices by selected language
        const filteredVoices = voices.filter(voice => 
            voice.lang === selectedLanguage || 
            voice.lang.startsWith(selectedLanguage.split('-')[0])
        );
        
        if (filteredVoices.length === 0) {
            voiceSelect.innerHTML = '<option value="">No voices available</option>';
            return;
        }
        
        // Add voices to dropdown
        filteredVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }
    
    function getSelectedVoice() {
        const voiceName = voiceSelect.value;
        return voices.find(voice => voice.name === voiceName);
    }
    
    function playText() {
        // Stop any current playback
        stopPlayback();
        
        // Get the text to speak
        let textToSpeak;
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        
        if (activeTab === 'text') {
            textToSpeak = textInput.value.trim();
        } else {
            textToSpeak = ssmlInput.value.trim();
        }
        
        if (!textToSpeak) {
            alert('Please enter some text to speak');
            return;
        }
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Configure utterance
        const voice = getSelectedVoice();
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.rate = parseFloat(rateControl.value);
        utterance.pitch = parseFloat(pitchControl.value);
        
        // Start recording for download (if supported)
        startRecording(utterance);
        
        // Speak the text
        synth.speak(utterance);
        currentUtterance = utterance;
        
        // Update UI during playback
        playBtn.disabled = true;
        stopBtn.disabled = false;
        
        utterance.onend = () => {
            playBtn.disabled = false;
            stopBtn.disabled = true;
            stopRecording();
        };
    }
    
    function stopPlayback() {
        if (synth.speaking) {
            synth.cancel();
            stopRecording();
        }
        playBtn.disabled = false;
        stopBtn.disabled = true;
    }
    
    function startRecording(utterance) {
        // This is a simplified approach. For a real implementation, you'd need:
        // 1. The Web Audio API to capture the speech output
        // 2. Or a server-side solution with Google TTS API
        
        // Reset audio chunks
        audioChunks = [];
        
        // Note: The Web Speech API doesn't provide direct access to the audio stream
        // This is a placeholder for a more complete solution
        console.log('Recording started for utterance:', utterance.text);
    }
    
    function stopRecording() {
        console.log('Recording stopped');
        // Here you would process the recorded audio chunks
    }
    
    function downloadAudio() {
        // In a real implementation, this would use the recorded audio
        // For now, we'll simulate it with the text content
        
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        let textContent;
        
        if (activeTab === 'text') {
            textContent = textInput.value.trim();
        } else {
            textContent = ssmlInput.value.trim();
        }
        
        if (!textContent) {
            alert('Please enter some text first');
            return;
        }
        
        // Create filename
        const filename = textContent.substring(0, 20).replace(/[^\w]/g, '_') + 
                        '_' + new Date().getTime() + '.mp3';
        
        // In a real app, we would:
        // 1. Use the MediaRecorder API to get the actual audio
        // 2. Or call a server endpoint with Google TTS API
        // For now, we'll just show an alert
        
        alert(`In a full implementation, this would download: ${filename}\n\n` +
              `The audio would be generated from: ${textContent}`);
        
        // This is where you would create and trigger the download
        // const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        // const audioUrl = URL.createObjectURL(audioBlob);
        // const a = document.createElement('a');
        // a.href = audioUrl;
        // a.download = filename;
        // a.click();
    }
    
    function updateSsmlPreview() {
        // Extract text content from SSML (simple version - would need proper parsing)
        const ssmlText = ssmlInput.value;
        const textOnly = ssmlText.replace(/<[^>]+>/g, '').trim();
        ssmlPreview.textContent = textOnly || 'SSML preview will appear here';
    }
    
    function insertSsmlTag(tag, params = '') {
        const textarea = ssmlInput;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const selectedText = textarea.value.substring(startPos, endPos);
        
        let tagToInsert;
        
        if (tag === 'break') {
            tagToInsert = `<${tag} ${params}/>`;
        } else {
            tagToInsert = `<${tag} ${params}>${selectedText || 'text'}</${tag}>`;
        }
        
        // Insert the tag
        textarea.value = textarea.value.substring(0, startPos) + 
                        tagToInsert + 
                        textarea.value.substring(endPos);
        
        // Set cursor position
        const newCursorPos = startPos + tagToInsert.length;
        if (tag === 'break') {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        } else if (!selectedText) {
            textarea.setSelectionRange(newCursorPos - (tag.length + 3), newCursorPos - (tag.length + 3));
        }
        
        // Update preview
        updateSsmlPreview();
        
        // Focus back on the textarea
        textarea.focus();
    }
    
    // Google TTS API integration would go here
    // This would require a server-side component or API key management
    async function useGoogleTTS(text, language, voiceName, speed, pitch) {
        // Implementation would:
        // 1. Make a request to Google TTS API
        // 2. Return the audio data
        // 3. Handle API key management and quotas
        console.log('Google TTS would be used here with params:', {
            text, language, voiceName, speed, pitch
        });
    }
});