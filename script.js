// Core Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all DOM elements
    initializeElements();
    
    // Set up initial state
    setupInitialState();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Start IP detection
    detectIP();
    
    console.log('Application initialized successfully');
});

// Element references
let introScreen, optionsPage, tapToBegin, sidebar, chatContainer, chatDisplay, 
    inputField, sendBtn, micBtn, cameraBtn, mapBtn, voiceSpeedSelect,
    nameInput, introInput, pinInput, passcodeInput, optionsSubmit,
    optionsBack, optionsBackTop, backBtn, mapPlaceholder, chatHistoryList,
    voiceToggleBtn, voiceOptions, mainContainer;

// Initialize all DOM elements
function initializeElements() {
    introScreen = document.getElementById('intro-screen');
    optionsPage = document.getElementById('options-page');
    tapToBegin = document.getElementById('tap-to-begin');
    sidebar = document.getElementById('sidebar');
    chatContainer = document.getElementById('chat-container');
    chatDisplay = document.getElementById('chat-display');
    inputField = document.getElementById('input-field');
    sendBtn = document.getElementById('send-btn');
    micBtn = document.getElementById('mic-btn');
    cameraBtn = document.getElementById('camera-btn');
    mapBtn = document.getElementById('map-btn');
    voiceSpeedSelect = document.getElementById('voice-speed-select');
    nameInput = document.getElementById('name-input');
    introInput = document.getElementById('intro-input');
    pinInput = document.getElementById('pin-input');
    passcodeInput = document.getElementById('passcode-input');
    optionsSubmit = document.getElementById('options-submit');
    optionsBack = document.getElementById('options-back');
    optionsBackTop = document.getElementById('options-back-top');
    backBtn = document.getElementById('back-btn');
    mapPlaceholder = document.getElementById('map-placeholder');
    chatHistoryList = document.getElementById('chat-history-list');
    voiceToggleBtn = document.getElementById('voice-toggle-btn');
    voiceOptions = document.getElementById('voice-options');
    mainContainer = document.getElementById('main-container');
    
    // Log any missing elements for debugging
    const elements = {
        introScreen, optionsPage, tapToBegin, sidebar, chatContainer, chatDisplay, 
        inputField, sendBtn, micBtn, cameraBtn, mapBtn, voiceSpeedSelect,
        nameInput, introInput, pinInput, passcodeInput, optionsSubmit,
        optionsBack, optionsBackTop, backBtn, mapPlaceholder, chatHistoryList,
        voiceToggleBtn, voiceOptions, mainContainer
    };
    
    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element not found: ${name}`);
        }
    }
}

// State variables
let userIP = '';
let userName = '';
let userIntro = '';
let userPin = '';
let userPasscode = '';
let isSubscribed = false;
let adminBypass = false;
let chatHistory = {};
let currentTab = 'new';
let lastCheck = Date.now();
let currentVoice = 'UK English Male';
let isVoiceMuted = false;
let voiceSpeed = 1.0;
let isTyping = false;

// Enhanced Conversation Memory
let conversationMemory = {
    patterns: [],
    adminInstructions: [],
    userInteractions: [],
    userVoiceProfile: { tone: 'neutral', slang: [], pace: 'medium' },
    trainingSets: [],
    userPreferences: {
        greetingStyle: 'standard',
        timeOfDay: '',
        lastInteractionMood: 'neutral',
        favoriteTopics: []
    }
};

// Setup initial state from localStorage
function setupInitialState() {
    // Load user data from localStorage
    userName = localStorage.getItem('userName') || '';
    userIntro = localStorage.getItem('userIntro') || '';
    userPin = localStorage.getItem('userPin') || '';
    userPasscode = localStorage.getItem('userPasscode') || '';
    isSubscribed = localStorage.getItem('isSubscribed') === 'true';
    lastCheck = localStorage.getItem('lastCheck') || Date.now();
    voiceSpeed = parseFloat(localStorage.getItem('voiceSpeed')) || 1.0;
    
    // Load chat history and conversation memory
    try {
        chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || {};
    } catch (e) {
        console.error('Failed to parse chat history:', e);
        chatHistory = {};
    }
    
    try {
        const savedMemory = localStorage.getItem('conversationMemory');
        if (savedMemory) {
            conversationMemory = JSON.parse(savedMemory);
        }
    } catch (e) {
        console.error('Failed to parse conversation memory:', e);
    }
    
    // Set initial UI state
    if (introScreen) introScreen.classList.remove('hidden');
    if (optionsPage) optionsPage.classList.add('hidden');
    if (chatContainer) chatContainer.classList.add('hidden');
    if (mainContainer) mainContainer.style.display = 'none';
    
    // Apply saved display settings
    if (conversationMemory.displaySettings && chatDisplay) {
        chatDisplay.style.fontSize = `${conversationMemory.displaySettings.fontSize || 16}px`;
        if (conversationMemory.displaySettings.color) {
            chatDisplay.style.color = conversationMemory.displaySettings.color;
        }
    }
    
    // Set voice speed select value if element exists
    if (voiceSpeedSelect) {
        voiceSpeedSelect.value = voiceSpeed.toString();
    }
    
    console.log('Initial state setup complete');
}

// Initialize all event listeners
function initializeEventListeners() {
    // Tap to begin functionality
    initializeTapToBegin();
    
    // Options page buttons
    if (optionsSubmit) {
        optionsSubmit.addEventListener('click', handleOptionsSubmit);
    }
    
    if (optionsBack) {
        optionsBack.addEventListener('click', handleOptionsBack);
    }
    
    if (optionsBackTop) {
        optionsBackTop.addEventListener('click', handleOptionsBack);
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', handleBackButton);
    }
    
    // Chat input functionality
    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }
    
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && sendBtn) sendBtn.click();
        });
        
        // Track typing state to disable swipe
        inputField.addEventListener('focus', () => {
            isTyping = true;
        });
        
        inputField.addEventListener('blur', () => {
            isTyping = false;
        });
        
        // Prevent typing touches from triggering swipe
        inputField.addEventListener('touchstart', (e) => e.stopPropagation());
        inputField.addEventListener('touchmove', (e) => e.stopPropagation());
        inputField.addEventListener('touchend', (e) => e.stopPropagation());
    }
    
    // Feature buttons
    if (micBtn) {
        micBtn.addEventListener('click', handleMicButton);
    }
    
    if (cameraBtn) {
        cameraBtn.addEventListener('click', handleCameraButton);
    }
    
    if (mapBtn) {
        mapBtn.addEventListener('click', handleMapButton);
    }
    
    if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener('click', handleVoiceToggle);
    }
    
    if (voiceOptions) {
        voiceOptions.addEventListener('change', handleVoiceOptionChange);
    }
    
    if (voiceSpeedSelect) {
        voiceSpeedSelect.addEventListener('change', handleVoiceSpeedChange);
    }
    
    // Swipe gesture handlers
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    // Creator credit easter egg
    document.addEventListener('keydown', (e) => {
        if (e.key === '?' && e.shiftKey) {
            addMessage("My Self, built by Cosmos Coderr. Hit: cosmoscoderr@gmail.com.");
        }
    });
    
    // Initialize chat history display
    displayChatHistory();
    
    // Start sentient overseer
    setInterval(sentientOverseer, 30000);
    
    console.log('Event listeners initialized');
}

// IP Detection
async function detectIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
    } catch (error) {
        userIP = '192.168.1.100';
        console.error('IP Detection Error:', error);
    }
    localStorage.setItem('userIP', userIP);
    checkSubscriptionStatus();
}

// Encryption Functions
function encryptData(data, pin) {
    if (typeof CryptoJS === 'undefined') {
        console.error('CryptoJS not loaded');
        return data;
    }
    return CryptoJS.AES.encrypt(data, pin).toString();
}

function decryptData(encryptedData, pin) {
    if (typeof CryptoJS === 'undefined') {
        console.error('CryptoJS not loaded');
        return '';
    }
    
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, pin);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption Error:', error);
        return '';
    }
}

// Tap to Begin Functionality
function initializeTapToBegin() {
    if (tapToBegin) {
        // Remove any existing event listeners to prevent duplicates
        tapToBegin.removeEventListener('click', handleTapToBegin);
        tapToBegin.removeEventListener('touchstart', handleTapToBeginTouch);
        
        // Add event listeners with proper event handling
        tapToBegin.addEventListener('click', handleTapToBegin);
        tapToBegin.addEventListener('touchstart', handleTapToBeginTouch);
        
        console.log('Tap to begin listeners initialized');
    } else {
        console.error('Tap to begin element not found');
        // Try again after a short delay in case DOM is still loading
        setTimeout(initializeTapToBegin, 500);
    }
    
    // Add fallback document-level handlers
    document.addEventListener('click', function(e) {
        // Check if the click was on or inside the tap-to-begin element
        if (e.target.id === 'tap-to-begin' || e.target.closest('#tap-to-begin')) {
            console.log('Tap to begin clicked via document handler');
            handleTapToBegin();
        }
    });
    
    document.addEventListener('touchstart', function(e) {
        // Check if the touch was on or inside the tap-to-begin element
        if (e.target.id === 'tap-to-begin' || e.target.closest('#tap-to-begin')) {
            console.log('Tap to begin touched via document handler');
            e.preventDefault(); // Prevent default touch behavior
            handleTapToBegin();
        }
    });
}

// Separate touch handler to prevent double firing
function handleTapToBeginTouch(e) {
    e.preventDefault(); // Prevent default touch behavior
    handleTapToBegin();
}

// Intro to Options
function handleTapToBegin() {
    console.log('Tap to begin triggered');
    
    if (!introScreen || !optionsPage) {
        console.error('Required elements not found');
        return;
    }
    
    introScreen.classList.add('hidden');
    optionsPage.classList.remove('hidden');
    
    if (userName && nameInput) {
        nameInput.value = userName;
        if (introInput) introInput.value = userIntro;
        if (pinInput) pinInput.value = userPin;
        if (passcodeInput) {
            passcodeInput.placeholder = 'Enter your passcode';
            passcodeInput.focus();
        }
    } else if (nameInput) {
        nameInput.focus();
    }
}

// Options Page Logic
function handleOptionsSubmit() {
    if (!nameInput || !introInput || !pinInput || !passcodeInput) {
        console.error('Form elements not found');
        return;
    }
    
    userName = nameInput.value.trim();
    userIntro = introInput.value.trim();
    userPin = pinInput.value.trim();
    const enteredPasscode = passcodeInput.value.trim();

    if (!userName) {
        alert('Please enter your name!');
        return;
    }

    if (enteredPasscode === 'guru' || enteredPasscode === 'ancient one') {
        adminBypass = true;
        if (optionsPage) optionsPage.classList.add('hidden');
        if (mainContainer) mainContainer.style.display = 'flex';
        if (chatContainer) chatContainer.classList.remove('hidden');
        addMessage("Admin access on, Kofi Fosu. Let's run this.");
    } else if (userPasscode && enteredPasscode !== userPasscode) {
        alert('Wrong passcode, fam!');
        return;
    } else {
        localStorage.setItem('userName', userName);
        localStorage.setItem('userIntro', userIntro);
        localStorage.setItem('userPin', userPin);
        if (!userPasscode && isSubscribed) {
            userPasscode = `X${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
            localStorage.setItem('userPasscode', userPasscode);
            addMessage(`Passcode set: ${userPasscode}. Lock it in!`);
        }
        if (optionsPage) optionsPage.classList.add('hidden');
        if (mainContainer) mainContainer.style.display = 'flex';
        if (chatContainer) chatContainer.classList.remove('hidden');
        fuseWithUser(userIntro);
        
        // Use personalized welcome message
        const welcomeMessage = generateWelcomeMessage(userName);
        addMessage(welcomeMessage);
        
        // Add voice announcement with personalized greeting
        if (typeof responsiveVoice !== 'undefined' && !isVoiceMuted) {
            try {
                // Play a subtle sound to indicate successful login
                const loginSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');
                loginSound.volume = 0.3;
                loginSound.play().catch(e => console.log('Audio play failed:', e));
                
                // Slight delay before voice greeting for better user experience
                setTimeout(() => {
                    responsiveVoice.speak(welcomeMessage, currentVoice, { 
                        rate: parseFloat(voiceSpeed),
                        onstart: () => {
                            // Visual indicator that voice is speaking
                            if (voiceToggleBtn) voiceToggleBtn.classList.add('speaking');
                        },
                        onend: () => {
                            if (voiceToggleBtn) voiceToggleBtn.classList.remove('speaking');
                        }
                    });
                }, 500);
            } catch (e) {
                console.error('Voice playback error:', e);
            }
        }
    }
}

// Back Buttons
function handleOptionsBack() {
    if (optionsPage) optionsPage.classList.add('hidden');
    if (introScreen) introScreen.classList.remove('hidden');
    if (mainContainer) mainContainer.style.display = 'none';
    
    // Clear input fields
    if (nameInput) nameInput.value = '';
    if (introInput) introInput.value = '';
    if (pinInput) pinInput.value = '';
    if (passcodeInput) passcodeInput.value = '';
}

function handleBackButton() {
    if (chatContainer) chatContainer.classList.add('hidden');
    if (optionsPage) optionsPage.classList.remove('hidden');
    if (mainContainer) mainContainer.style.display = 'none';
    
    if (inputField) inputField.value = '';
    
    // Restore user values to form
    if (nameInput) nameInput.value = userName;
    if (introInput) introInput.value = userIntro;
    if (pinInput) pinInput.value = userPin;
    if (passcodeInput) {
        passcodeInput.placeholder = userPasscode ? 'Enter your passcode' : 'Enter passcode (if returning)';
    }
}

// Swipe Gestures
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isVerticalScroll = false;

function handleTouchStart(e) {
    // Ignore if touch s<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>
