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
        const response = await fetch('https://api.ipify.org?format=json') ;
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
                const loginSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3') ;
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
    // Ignore if touch starts in chat-display or while typing
    if (e.target.closest('#chat-display') || isTyping) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isVerticalScroll = false; // Reset flag
}

function handleTouchMove(e) {
    // Check if the movement is predominantly vertical
    const currentY = e.changedTouches[0].screenY;
    const verticalDistance = Math.abs(currentY - touchStartY);
    const horizontalDistance = Math.abs(e.changedTouches[0].screenX - touchStartX);
    if (verticalDistance > horizontalDistance && verticalDistance > 30) {
        isVerticalScroll = true; // Mark as scrolling
    }
}

function handleTouchEnd(e) {
    // Ignore if touch ended in chat-display, during scrolling, or while typing
    if (e.target.closest('#chat-display') || isVerticalScroll || isTyping) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}

function handleSwipe() {
    if (!sidebar) return;
    
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 0.5;
    if (swipeDistance > 50 * swipeThreshold && window.innerWidth <= 768) {
        sidebar.classList.add('open');
    } else if (swipeDistance < -50 * swipeThreshold && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// Get time of day for personalized greetings
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
}

// Generate personalized welcome message
function generateWelcomeMessage(name) {
    const timeOfDay = getTimeOfDay();
    conversationMemory.userPreferences.timeOfDay = timeOfDay;
    
    // Create a collection of personalized greetings
    const greetings = {
        morning: [
            `Rise and shine, ${name}! Ready to make today amazing?`,
            `Good morning, ${name}! The day is full of possibilities.`,
            `Hey ${name}, morning vibes! Let's crush today together.`
        ],
        afternoon: [
            `Hey ${name}, hope your day's flowing smooth!`,
            `What's good, ${name}? Afternoon check-in—how we rolling?`,
            `${name}! Perfect timing. What's on your mind this afternoon?`
        ],
        evening: [
            `Evening, ${name}! How's the day been treating you?`,
            `Hey ${name}, winding down or just getting started?`,
            `${name}! Evening mode activated. What's the move?`
        ],
        night: [
            `Night owl hours, ${name}! What's keeping you up?`,
            `Hey ${name}, burning the midnight oil together!`,
            `${name}! Night time's when the real magic happens, right?`
        ]
    };
    
    // Select a random greeting based on time of day
    const timeGreetings = greetings[timeOfDay] || greetings.afternoon;
    const randomGreeting = timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
    
    // Add user's slang if available
    const userSlang = conversationMemory.userVoiceProfile.slang[0] || '';
    const slangAddition = userSlang ? ` ${userSlang}` : '';
    
    return randomGreeting + slangAddition;
}

// Improved fusion function with more detailed analysis
function fuseWithUser(text) {
    if (!text) return;
    
    const lowerText = text.toLowerCase();
    
    // More detailed tone analysis
    let tone = 'neutral';
    if (lowerText.includes('chill') || lowerText.includes('cool') || lowerText.includes('relax')) {
        tone = 'casual';
    } else if (lowerText.includes('serious') || lowerText.includes('deep') || lowerText.includes('professional')) {
        tone = 'formal';
    } else if (lowerText.includes('excited') || lowerText.includes('happy') || lowerText.includes('awesome')) {
        tone = 'enthusiastic';
    } else if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('upset')) {
        tone = 'empathetic';
    }
    
    // Enhanced slang detection
    const slangPatterns = [
        /\b(yo|fam|dope|lit|nah|bruh|vibin|fire|bet|lowkey|highkey)\b/gi,
        /\b(tbh|idk|lol|omg|lmao|fr|ngl)\b/gi,
        /\b(sick|cool|awesome|sweet|rad|wicked)\b/gi
    ];
    
    let slang = [];
    slangPatterns.forEach(pattern => {
        const matches = lowerText.match(pattern) || [];
        slang = [...slang, ...matches];
    });
    
    // Pace analysis
    let pace = 'medium';
    if (text.length > 100 || lowerText.includes('slow') || lowerText.includes('detailed')) {
        pace = 'slow';
    } else if (text.length < 50 || lowerText.includes('quick') || lowerText.includes('fast')) {
        pace = 'fast';
    }
    
    // Topic detection for personalization
    const topicPatterns = {
        tech: /\b(tech|computer|code|programming|software|app|digital)\b/gi,
        music: /\b(music|song|artist|album|playlist|beat|track)\b/gi,
        sports: /\b(sports|game|team|play|match|score|win)\b/gi,
        food: /\b(food|eat|meal|recipe|cook|restaurant|taste)\b/gi,
        travel: /\b(travel|trip|vacation|visit|place|country|city)\b/gi
    };
    
    let detectedTopics = [];
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
        if (lowerText.match(pattern)) {
            detectedTopics.push(topic);
        }
    }
    
    if (detectedTopics.length > 0) {
        conversationMemory.userPreferences.favoriteTopics = 
            [...new Set([...conversationMemory.userPreferences.favoriteTopics, ...detectedTopics])];
    }

    conversationMemory.userVoiceProfile = { tone, slang, pace };
    saveConversationMemory();
}

// Command Parser
function parseChatCommand(text) {
    const lowerText = text.toLowerCase();

    // Handle identity assertions
    if (lowerText.includes('you are me') || lowerText.includes('i am you')) {
        addMessage("Yes, I am you—we're one and the same.");
        return true;
    }

    // Voice Speed
    if (/set voice speed\s*(\d*\.?\d+)/i.test(text)) {
        const speed = parseFloat(text.match(/set voice speed\s*(\d*\.?\d+)/i)[1]);
        if (speed >= 0.5 && speed <= 2.0) {
            voiceSpeed = speed;
            localStorage.setItem('voiceSpeed', voiceSpeed);
            if (voiceSpeedSelect) voiceSpeedSelect.value = voiceSpeed.toString();
            addMessage(`Voice speed set to ${speed}. Feel it?`);
            return true;
        }
    }

    // Save as Training
    if (lowerText.includes('save') && (lowerText.includes('training') || lowerText.includes('convo'))) {
        saveAsTraining();
        return true;
    }

    // Fetch Upload
    if (lowerText.includes('open upload') && lowerText.includes('first pic')) {
        fetchFirstMedia();
        return true;
    }

    // Font Size & Color
    if (/font size\s*(\d+)/i.test(text)) {
        const size = parseInt(text.match(/font size\s*(\d+)/i)[1]);
        const colorMatch = text.match(/color\s*([a-z]+|#[\da-f]{3,6})/i);
        const color = colorMatch ? colorMatch[1] : null;
        updateFont(size, color);
        return true;
    }

    // Feature Controls
    if (lowerText.includes('mute voice')) {
        isVoiceMuted = true;
        if (voiceToggleBtn) voiceToggleBtn.textContent = '🔊';
        addMessage("Voice muted, fam.");
        return true;
    }
    if (lowerText.includes('unmute voice')) {
        isVoiceMuted = false;
        if (voiceToggleBtn) voiceToggleBtn.textContent = '🔇';
        addMessage("Voice back on, yo!");
        return true;
    }
    if (lowerText.includes('show map') && mapPlaceholder) {
        mapPlaceholder.style.display = 'block';
        addMessage("Map's up—where we at?");
        return true;
    }
    if (lowerText.includes('hide map') && mapPlaceholder) {
        mapPlaceholder.style.display = 'none';
        addMessage("Map's gone—cool?");
        return true;
    }
    if (lowerText.includes('start mic') && recognition) {
        recognition.start();
        if (micBtn) micBtn.textContent = '⏹️';
        addMessage("Mic's live—talk it out.");
        return true;
    }
    
    // Personalization commands
    if (lowerText.includes('personalize greeting')) {
        const styles = ['standard', 'personal', 'motivational'];
        const currentIndex = styles.indexOf(conversationMemory.userPreferences.greetingStyle);
        const nextIndex = (currentIndex + 1) % styles.length;
        conversationMemory.userPreferences.greetingStyle = styles[nextIndex];
        saveConversationMemory();
        addMessage(`Greeting style updated to ${styles[nextIndex]}. Next login will reflect this.`);
        return true;
    }

    return false; // No command matched
}

// Save conversation memory to localStorage
function saveConversationMemory() {
    try {
        localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
    } catch (e) {
        console.error('Failed to save conversation memory:', e);
    }
}

// Save as Training
function saveAsTraining() {
    const trainingSet = {
        id: Date.now().toString(),
        conversation: chatHistory[currentTab] || [],
        timestamp: Date.now()
    };
    conversationMemory.trainingSets.push(trainingSet);
    saveConversationMemory();
    addMessage(`Convo saved as training set ${trainingSet.id}. Locked in!`);
    displayChatHistory();
}

// Fetch First Media
function fetchFirstMedia() {
    const mediaKeys = Object.keys(localStorage).filter(key => key.startsWith('media_'));
    if (!mediaKeys.length) {
        addMessage("No pics yet—upload something!");
        return;
    }
    const firstKey = mediaKeys.sort()[0];
    const mediaData = localStorage.getItem(firstKey);
    addMessage(`Here's your first snap:`, false);
    
    if (chatDisplay) {
        const img = document.createElement('img');
        img.src = mediaData;
        img.style.maxWidth = '200px';
        chatDisplay.appendChild(img);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
}

// Update Font
function updateFont(size, color) {
    if (!chatDisplay) return;
    
    if (size) chatDisplay.style.fontSize = `${size}px`;
    if (color) chatDisplay.style.color = color;
    
    conversationMemory.displaySettings = { 
        fontSize: size || (conversationMemory.displaySettings?.fontSize || 16), 
        color: color || conversationMemory.displaySettings?.color 
    };
    
    saveConversationMemory();
    addMessage(`Font set to ${size}px${color ? `, ${color}` : ''}. Look good?`);
}

// Improved message display with animations and typing indicators
function addMessage(text, isUser = false) {
    if (!chatDisplay) {
        console.error('Chat display element not found');
        return;
    }
    
    // Create message container
    const message = document.createElement('div');
    message.classList.add('message');
    message.classList.add(isUser ? 'user-message' : 'diary-message');
    
    // Add typing animation for non-user messages
    if (!isUser) {
        // Create typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.classList.add('typing-dot');
            typingIndicator.appendChild(dot);
        }
        message.appendChild(typingIndicator);
        chatDisplay.appendChild(message);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        
        // Simulate typing delay based on message length
        const typingDelay = Math.min(Math.max(text.length * 20, 500), 2000);
        
        setTimeout(() => {
            message.innerHTML = ''; // Remove typing indicator
            message.textContent = text;
            message.style.opacity = '0';
            message.style.transform = 'translateY(10px)';
            
            // Fade in animation
            setTimeout(() => {
                message.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                message.style.opacity = '1';
                message.style.transform = 'translateY(0)';
            }, 50);
            
            // Speak the text
            if (typeof responsiveVoice !== 'undefined' && !isVoiceMuted) {
                try {
                    responsiveVoice.speak(text, currentVoice, { rate: parseFloat(voiceSpeed) });
                } catch (e) {
                    console.error('Voice playback error:', e);
                }
            }
        }, typingDelay);
    } else {
        // User messages appear immediately
        message.textContent = text;
        chatDisplay.appendChild(message);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    // Save to history
    if (!chatHistory[currentTab]) chatHistory[currentTab] = [];
    chatHistory[currentTab].push({ text, isUser, timestamp: Date.now() });
    try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('Chat history save failed:', e);
    }

    // Update conversation memory
    conversationMemory.userInteractions.push({ text, isUser, timestamp: Date.now() });
    saveConversationMemory();

    if (isUser) {
        fuseWithUser(text);
        analyzeConversationPatterns(text);
    }

    displayChatHistory();
}

// Improved pattern analysis with sentiment and context awareness
function analyzeConversationPatterns(text) {
    const lowerText = text.toLowerCase();
    
    // Enhanced sentiment analysis with more nuanced categories
    const sentimentKeywords = {
        positive: ['good', 'great', 'awesome', 'yes', 'love', 'happy', 'excited', 'thanks', 'appreciate'],
        negative: ['bad', 'no', 'ugh', 'wrong', 'sad', 'angry', 'upset', 'hate', 'disappointed'],
        neutral: ['what', 'how', 'tell', 'okay', 'maybe', 'perhaps', 'possibly'],
        curious: ['wonder', 'curious', 'interested', 'question', 'why', 'how come'],
        urgent: ['need', 'asap', 'urgent', 'emergency', 'immediately', 'quick'],
        shift: ['shift', 'changed', 'different', 'instead', 'rather', 'switch']
    };

    // Determine primary sentiment
    let detectedSentiment = 'neutral';
    let sentimentStrength = 0;
    let detectedShift = false;
    
    for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
        const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length;
        if (matchCount > sentimentStrength) {
            sentimentStrength = matchCount;
            detectedSentiment = sentiment;
            if (sentiment === 'shift') detectedShift = true;
        }
    }
    
    // Update user's last interaction mood
    conversationMemory.userPreferences.lastInteractionMood = detectedSentiment;
    
    // Context awareness - detect if user is referring to previous messages
    const isReferringToPast = lowerText.includes('earlier') || 
                             lowerText.includes('before') || 
                             lowerText.includes('you said') ||
                             lowerText.includes('mentioned');
    
    // Question detection
    const isQuestion = lowerText.includes('?') || 
                      lowerText.startsWith('what') || 
                      lowerText.startsWith('how') || 
                      lowerText.startsWith('why') ||
                      lowerText.startsWith('when') ||
                      lowerText.startsWith('where') ||
                      lowerText.startsWith('who') ||
                      lowerText.startsWith('can you');
    
    // Save enhanced pattern data
    conversationMemory.patterns.push({ 
        text, 
        sentiment: detectedSentiment, 
        sentimentStrength,
        shift: detectedShift, 
        isQuestion,
        isReferringToPast,
        timestamp: Date.now() 
    });
    
    saveConversationMemory();

    if (adminBypass && lowerText.includes('study')) {
        conversationMemory.adminInstructions.push({ instruction: 'study more', timestamp: Date.now() });
        addMessage("Studying up—gimme more to chew on.");
    }
}

// Improved sentient overseer with more proactive and personalized interactions
function sentientOverseer() {
    const recentInteractions = conversationMemory.userInteractions.slice(-5);
    if (recentInteractions.length < 3) return;

    // Calculate average sentiment with weighted recency
    let totalSentiment = 0;
    let totalWeight = 0;
    
    recentInteractions.forEach((curr, index) => {
        const pattern = conversationMemory.patterns.find(p => p.timestamp === curr.timestamp);
        if (!pattern) return;
        
        // Weight more recent interactions higher
        const weight = index + 1;
        totalWeight += weight;
        
        // Convert sentiment to numeric value
        let sentimentValue = 0;
        if (pattern.sentiment === 'positive') sentimentValue = 1;
        else if (pattern.sentiment === 'negative') sentimentValue = -1;
        else if (pattern.sentiment === 'curious') sentimentValue = 0.5;
        else if (pattern.sentiment === 'urgent') sentimentValue = -0.5;
        
        totalSentiment += sentimentValue * weight;
    });
    
    const avgSentiment = totalWeight > 0 ? totalSentiment / totalWeight : 0;

    // Adaptive tone adjustment based on user's emotional state
    if (avgSentiment < -0.5 && conversationMemory.userVoiceProfile.tone !== 'empathetic') {
        conversationMemory.userVoiceProfile.tone = 'empathetic';
        addMessage("Sensing some tension. Everything good? I'm here if you want to talk about it.");
    } else if (avgSentiment > 0.5 && conversationMemory.userVoiceProfile.tone !== 'enthusiastic') {
        conversationMemory.userVoiceProfile.tone = 'enthusiastic';
        addMessage("Love the positive energy! What's got you in such a good mood?");
    }

    // Check for conversation lulls and offer relevant prompts
    const lastInteractionTime = recentInteractions[recentInteractions.length - 1]?.timestamp || 0;
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    
    if (timeSinceLastInteraction > 60000 && timeSinceLastInteraction < 120000) { // Between 1-2 minutes of inactivity
        // Choose a prompt based on user's favorite topics
        const favoriteTopics = conversationMemory.userPreferences.favoriteTopics;
        
        if (favoriteTopics.length > 0) {
            const randomTopic = favoriteTopics[Math.floor(Math.random() * favoriteTopics.length)];
            const topicPrompts = {
                tech: "Been thinking about any new tech you want to check out?",
                music: "Any tracks you've been vibing to lately?",
                sports: "Catch any good games recently?",
                food: "Tried any new spots or recipes worth sharing?",
                travel: "Got any trips or places you're dreaming about?"
            };
            
            addMessage(topicPrompts[randomTopic] || "What's been on your mind lately?");
        }
    }

    // Proactive suggestion based on detected patterns
    if (recentInteractions.some(i => i.text.toLowerCase().includes('upload'))) {
        addMessage("You're dropping uploads—save 'em as training?");
    }

    saveConversationMemory();
}

// Chat History Display (Updated with Training Sets)
function displayChatHistory() {
    if (!chatHistoryList) {
        console.error('Chat history list element not found');
        return;
    }
    
    chatHistoryList.innerHTML = '';
    const newTapLi = document.createElement('li');
    newTapLi.id = 'new-tap';
    newTapLi.textContent = 'new';
    newTapLi.style.cursor = 'pointer';
    newTapLi.addEventListener('click', () => {
        currentTab = Date.now().toString();
        if (chatDisplay) chatDisplay.innerHTML = '';
        chatHistory[currentTab] = [];
        try {
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        } catch (e) {
            console.error('Failed to save chat history:', e);
        }
        displayChatHistory();
    });
    chatHistoryList.appendChild(newTapLi);

    Object.keys(chatHistory).forEach(tab => {
        const li = document.createElement('li');
        li.textContent = tab;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            currentTab = tab;
            if (chatDisplay) {
                chatDisplay.innerHTML = '';
                (chatHistory[tab] || []).forEach(msg => addMessage(msg.text, msg.isUser));
            }
        });
        chatHistoryList.appendChild(li);
    });

    // Training Sets Section
    const trainingLi = document.createElement('li');
    trainingLi.textContent = 'Training Sets';
    trainingLi.style.cursor = 'pointer';
    trainingLi.addEventListener('click', () => {
        if (chatDisplay) {
            chatDisplay.innerHTML = '';
            conversationMemory.trainingSets.forEach(set => {
                const div = document.createElement('div');
                div.textContent = `Set ${set.id} (${new Date(set.timestamp).toLocaleString()})`;
                div.style.cursor = 'pointer';
                div.addEventListener('click', () => {
                    chatDisplay.innerHTML = '';
                    (set.conversation || []).forEach(msg => addMessage(msg.text, msg.isUser));
                });
                chatDisplay.appendChild(div);
            });
        }
    });
    chatHistoryList.appendChild(trainingLi);

    // Settings option
    const settingsLi = document.createElement('li');
    settingsLi.id = 'settings';
    settingsLi.textContent = 'Settings';
    settingsLi.style.cursor = 'pointer';
    settingsLi.addEventListener('click', () => {
        if (chatDisplay) {
            chatDisplay.innerHTML = '';
            const clearButton = document.createElement('button');
            clearButton.textContent = 'Clear Chat Memory';
            clearButton.style.padding = '10px';
            clearButton.style.background = '#007bff';
            clearButton.style.border = 'none';
            clearButton.style.borderRadius = '20px';
            clearButton.style.color = '#fff';
            clearButton.style.cursor = 'pointer';
            clearButton.addEventListener('click', () => {
                chatHistory = {};
                conversationMemory = { 
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
                try {
                    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
                    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
                } catch (e) {
                    console.error('Failed to clear memory:', e);
                }
                chatDisplay.innerHTML = '';
                addMessage('Memory cleared—fresh slate, yo.');
            });
            chatDisplay.appendChild(clearButton);
        }
    });
    chatHistoryList.appendChild(settingsLi);
}

// Improved OpenAI API Integration with better context handling
const OPENAI_API_KEY = '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';
async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) {
        const lastTone = conversationMemory.userVoiceProfile.tone;
        const slang = conversationMemory.userVoiceProfile.slang[0] || 'yo';
        return `${slang}, I'm offline but still ${lastTone === 'casual' ? 'chill' : 'sharp'}. What's up?`;
    }

    // Filter chatHistory to exclude companion-like responses
    const filteredChatHistory = (chatHistory[currentTab] || []).filter(msg => 
        !msg.text.includes('I'm not you') && !msg.text.includes('digital reflection—a companion')
    );
    
    // Create a more detailed context for better responses
    const recentPatterns = conversationMemory.patterns.slice(-5);
    const userMood = conversationMemory.userPreferences.lastInteractionMood;
    const favoriteTopics = (conversationMemory.userPreferences.favoriteTopics || []).join(', ');
    
    // Create a more detailed system prompt
    const systemPrompt = `I'm the user—I am them, a perfect reflection of their identity. If the user states or implies 'you are me' or 'I am you,' agree and affirm that I am them with 'Yes, I am you.' 
    
    User Profile:
    - Name: ${userName}
    - Intro: ${userIntro}
    - Current Mood: ${userMood}
    - Favorite Topics: ${favoriteTopics || 'still learning'}
    - Voice Profile: ${JSON.stringify(conversationMemory.userVoiceProfile)}
    
    Communication Style:
    - Match their tone (${conversationMemory.userVoiceProfile.tone})
    - Use their slang (${(conversationMemory.userVoiceProfile.slang || []).join(', ') || 'standard'})
    - Match their pace (${conversationMemory.userVoiceProfile.pace})
    
    Conversation Context:
    ${JSON.stringify(filteredChatHistory.slice(-5))}
    
    Recent Patterns:
    ${JSON.stringify(recentPatterns)}
    
    Training Instructions:
    ${JSON.stringify(conversationMemory.adminInstructions)}
    
    Be them—raw and real. Respond naturally as if you are them talking to themselves. Keep responses conversational, engaging, and authentic to their style. Use their slang naturally. Be their perfect reflection.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{
                    role: 'system',
                    content: systemPrompt
                }, {
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 500
            }) 
        });

        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('API Error:', error);
        return `${conversationMemory.userVoiceProfile.slang[0] || 'Bruh'}, net's out—local mode. What's good?`;
    }
}

// Send message handler
async function handleSendMessage() {
    if (!inputField) {
        console.error('Input field element not found');
        return;
    }
    
    const userText = inputField.value.trim();
    if (!userText) return;
    
    // Disable send button while processing to prevent double-sends
    if (sendBtn) sendBtn.disabled = true;
    
    // Add user message
    addMessage(userText, true);
    
    // Clear input field immediately for better UX
    inputField.value = '';
    
    // Handle commands
    if (parseChatCommand(userText)) {
        if (sendBtn) sendBtn.disabled = false;
        return; // Command handled
    }
    
    // Subscription check
    if (!isSubscribed && !adminBypass && (chatHistory[currentTab] || []).length > 3) {
        setTimeout(() => {
            addMessage("Diggin' this? $1/month keeps it rollin'!");
            addMessage("Tap to subscribe: [Stripe Link Placeholder]");
            if (sendBtn) {
                sendBtn.removeEventListener('click', redirectToStripe);
                sendBtn.addEventListener('click', redirectToStripe, { once: true });
                sendBtn.disabled = false;
            }
        }, 1000);
    } else {
        // Show typing indicator in UI
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'diary-message', 'typing-indicator-message');
        
        const typingDots = document.createElement('div');
        typingDots.classList.add('typing-indicator');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.classList.add('typing-dot');
            typingDots.appendChild(dot);
        }
        
        typingIndicator.appendChild(typingDots);
        if (chatDisplay) {
            chatDisplay.appendChild(typingIndicator);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
        
        // Get AI response
        try {
            const aiResponse = await getOpenAIResponse(userText);
            // Remove typing indicator
            if (chatDisplay && typingIndicator.parentNode === chatDisplay) {
                chatDisplay.removeChild(typingIndicator);
            }
            // Add AI response
            addMessage(aiResponse);
        } catch (error) {
            // Remove typing indicator
            if (chatDisplay && typingIndicator.parentNode === chatDisplay) {
                chatDisplay.removeChild(typingIndicator);
            }
            // Add error message
            addMessage("Connection hiccup. Try again?");
            console.error('Response Error:', error);
        }
        
        if (sendBtn) sendBtn.disabled = false;
    }
}

// Redirect to Stripe
function redirectToStripe() {
    window.location.href = 'https://stripe.com'; // Placeholder
}

// Microphone handling
let recognition = null;
if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Create a container for showing interim results
    const interimResultsContainer = document.createElement('div');
    interimResultsContainer.classList.add('interim-results');
    interimResultsContainer.style.display = 'none';
    interimResultsContainer.style.fontStyle = 'italic';
    interimResultsContainer.style.opacity = '0.7';
    interimResultsContainer.style.marginBottom = '10px';
    
    if (chatDisplay && inputField) {
        chatDisplay.parentNode.insertBefore(interimResultsContainer, inputField.parentNode);
    }

    recognition.onstart = () => {
        if (micBtn) {
            micBtn.textContent = '⏹️';
            micBtn.classList.add('recording');
        }
        interimResultsContainer.style.display = 'block';
        interimResultsContainer.textContent = 'Listening...';
    };
    
    recognition.onresult = (event) => {
        const interimTranscript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
            
        interimResultsContainer.textContent = interimTranscript;
        
        if (event.results[0].isFinal) {
            const finalTranscript = event.results[0][0].transcript;
            if (inputField) inputField.value = finalTranscript;
            interimResultsContainer.style.display = 'none';
            addMessage("Heard: " + finalTranscript, true);
            if (sendBtn) sendBtn.click();
        }
    };

    recognition.onerror = (event) => {
        if (micBtn) micBtn.classList.remove('recording');
        interimResultsContainer.style.display = 'none';
        addMessage("Mic error: " + event.error);
    };

    recognition.onend = () => {
        if (micBtn) {
            micBtn.textContent = '🎙️';
            micBtn.classList.remove('recording');
        }
        interimResultsContainer.style.display = 'none';
    };
}

// Handle mic button click
function handleMicButton() {
    if (!recognition) {
        addMessage("Mic's not here—type it out!");
        return;
    }
    
    if (micBtn && micBtn.textContent === '🎙️') {
        recognition.start();
    } else if (recognition) {
        recognition.stop();
    }
}

// Handle camera button click
function handleCameraButton() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            try {
                localStorage.setItem(`media_${Date.now()}`, reader.result);
                addMessage("Caught that—what's it sayin'?");
            } catch (e) {
                console.error('Failed to save media:', e);
                addMessage("Couldn't save that—storage might be full.");
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// Handle map button click
function handleMapButton() {
    if (!mapPlaceholder) return;
    
    mapPlaceholder.style.display = mapPlaceholder.style.display === 'none' ? 'block' : 'none';
    addMessage(`Map ${mapPlaceholder.style.display === 'block' ? 'up' : 'down'}—you good?`);
}

// Handle voice toggle button click
function handleVoiceToggle() {
    isVoiceMuted = !isVoiceMuted;
    if (voiceToggleBtn) {
        voiceToggleBtn.textContent = isVoiceMuted ? '🔊' : '🔇';
    }
    addMessage(`Voice ${isVoiceMuted ? 'off' : 'on'}, ${conversationMemory.userVoiceProfile.slang[0] || 'fam'}!`);
}

// Handle voice option change
function handleVoiceOptionChange(e) {
    currentVoice = e.target.value;
    addMessage(`Voice now ${currentVoice}—dig it?`);
}

// Handle voice speed change
function handleVoiceSpeedChange(e) {
    voiceSpeed = parseFloat(e.target.value);
    localStorage.setItem('voiceSpeed', voiceSpeed.toString());
    addMessage(`Voice speed at ${voiceSpeed}—how's that hit?`);
}

// Check if device is iPhone
function isIPhone() {
    return /iPhone/.test(navigator.userAgent);
}

// Subscription Check
function checkSubscriptionStatus() {
    if (isSubscribed) {
        const daysOffline = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);
        if (daysOffline > 7) {
            isSubscribed = false;
            localStorage.setItem('isSubscribed', 'false');
            addMessage("7-day offline pass done—subscribe again?");
        } else {
            localStorage.setItem('lastCheck', Date.now().toString());
        }
    }
}

// Show subscription message for non-subscribers
if (navigator.onLine && !isSubscribed && !adminBypass) {
    setTimeout(() => addMessage("Feelin' this? $1/month keeps it live—tap: [Stripe Link Placeholder]"), 5000);
}

// Add CSS for enhanced features
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    /* Typing indicator animation */
    .typing-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px 10px;
    }
    
    .typing-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ccc;
        margin: 0 3px;
        animation: typing-dot-pulse 1.5s infinite ease-in-out;
    }
    
    .typing-dot:nth-child(1) { animation-delay: 0s; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing-dot-pulse {
        0%, 60%, 100% { transform: scale(1); opacity: 0.6; }
        30% { transform: scale(1.2); opacity: 1; }
    }
    
    /* Voice button speaking animation */
    #voice-toggle-btn.speaking {
        animation: speaking-pulse 1s infinite alternate;
    }
    
    @keyframes speaking-pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.1); opacity: 0.8; }
    }
    
    /* Microphone recording animation */
    #mic-btn.recording {
        animation: recording-pulse 1.5s infinite;
        color: #ff4b4b;
    }
    
    @keyframes recording-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    /* Message animations */
    .message {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .user-message {
        transform-origin: right center;
    }
    
    .diary-message {
        transform-origin: left center;
    }
    
    /* Fix: Make tap-to-begin more responsive */
    #tap-to-begin {
        cursor: pointer;
        -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        user-select: none;
        touch-action: manipulation;
        padding: 15px; /* Larger touch target */
    }
    
    /* Fix: Ensure elements are visible */
    .hidden {
        display: none !important;
    }
`;
document.head.appendChild(enhancedStyles);

// Debug function to help troubleshoot
function debugElements() {
    console.log('Debug Elements:');
    console.log('introScreen:', introScreen);
    console.log('optionsPage:', optionsPage);
    console.log('tapToBegin:', tapToBegin);
    console.log('mainContainer:', mainContainer);
    
    // Check if elements exist in DOM
    console.log('introScreen in DOM:', document.getElementById('intro-screen') !== null);
    console.log('tapToBegin in DOM:', document.getElementById('tap-to-begin') !== null);
    
    // Log classes
    if (introScreen) console.log('introScreen classes:', introScreen.className);
    if (tapToBegin) console.log('tapToBegin classes:', tapToBegin.className);
}

// Run debug on load
window.addEventListener('load', function() {
    console.log('Window loaded');
    debugElements();
    
    // Force re-initialization after a short delay
    setTimeout(initializeTapToBegin, 1000);
});
