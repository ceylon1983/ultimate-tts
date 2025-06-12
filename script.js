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
        
        // Auto-detect language from text input
        textInput.addEventListener('input', updateLanguageBasedOnText);
        ssmlInput.addEventListener('input', () => {
            updateSsmlPreview();
            updateLanguageBasedOnText();
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
        
        // Sort voices by language match quality
        const sortedVoices = [...voices].sort((a, b) => {
            const aMatch = a.lang === selectedLanguage;
            const bMatch = b.lang === selectedLanguage;
            return bMatch - aMatch || a.lang.localeCompare(b.lang);
        });

        if (sortedVoices.length === 0) {
            voiceSelect.innerHTML = '<option value="">No voices available</option>';
            return;
        }

        sortedVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            option.selected = voice.lang === selectedLanguage;
            voiceSelect.appendChild(option);
        });
    }
    
    function getSelectedVoice() {
        const voiceName = voiceSelect.value;
        return voices.find(voice => voice.name === voiceName);
    }
    
    function detectLanguage(text) {
        if (!text.trim()) return 'en-US';
        
        // First try franc for more accurate detection
        try {
            const langCode = franc(text);
            const mapping = {
                'eng': 'en-US',
                'spa': 'es-ES',
                'fra': 'fr-FR',
                'deu': 'de-DE',
                'hin': 'hi-IN',
                'jpn': 'ja-JP',
                'cmn': 'zh-CN',
                'ara': 'ar-SA',
                'rus': 'ru-RU',
                'por': 'pt-BR',
                'ita': 'it-IT',
                'nld': 'nl-NL',
                'kor': 'ko-KR'
            };
            if (mapping[langCode]) return mapping[langCode];
        } catch (e) {
            console.log("Franc detection failed, falling back to regex");
        }
        
        // Fallback to simple regex detection
        const patterns = {
            'hi-IN': /[\u0900-\u097F]/,
            'es-ES': /[áéíóúñ¿¡]/i,
            'fr-FR': /[àâäçéèêëîïôöùûüÿœæ]/i,
            'de-DE': /[äöüß]/i,
            'ja-JP': /[\u3040-\u30FF]/,
            'zh-CN': /[\u4E00-\u9FFF]/,
            'ar-SA': /[\u0600-\u06FF]/,
            'ru-RU': /[\u0400-\u04FF]/
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                return lang;
            }
        }
        return 'en-US';
    }
    
    function updateLanguageBasedOnText() {
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const text = activeTab === 'text' ? textInput.value : ssmlPreview.textContent;
        
        const detectedLang = detectLanguage(text);
        if (languageSelect.value !== detectedLang) {
            languageSelect.value = detectedLang;
            updateVoiceList();
        }
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
        
        // Speak the text
        synth.speak(utterance);
        currentUtterance = utterance;
        
        // Update UI during playback
        playBtn.disabled = true;
        stopBtn.disabled = false;
        
        utterance.onend = () => {
            playBtn.disabled = false;
            stopBtn.disabled = true;
        };
    }
    
    function stopPlayback() {
        if (synth.speaking) {
            synth.cancel();
        }
        playBtn.disabled = false;
        stopBtn.disabled = true;
    }
    
    function downloadAudio() {
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

        // Inform user about the limitation
        alert("For direct MP3 downloads, please use the 'Play' button and record your system audio. \n\nFor a complete solution with download capability, this application would need to be connected to a server-side text-to-speech service.");
        
        // Alternative: Provide instructions for recording
        console.log("To record the audio output:");
        console.log("1. Click 'Play' to hear the text");
        console.log("2. Use system audio recording software to capture the output");
        console.log("3. Save the recording as an MP3 file");
    }
    
    function updateSsmlPreview() {
        const ssmlText = ssmlInput.value;
        try {
            // Create a temporary div to parse the SSML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = ssmlText;
            ssmlPreview.innerHTML = tempDiv.textContent || 'SSML preview will appear here';
        } catch (e) {
            ssmlPreview.textContent = 'Invalid SSML content';
        }
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
});
