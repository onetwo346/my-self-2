// Core Elements
const introScreen = document.getElementById('intro-screen');
const optionsPage = document.getElementById('options-page');
const tapToBegin = document.getElementById('tap-to-begin');
const sidebar = document.getElementById('sidebar');
const chatContainer = document.getElementById('chat-container');
const chatDisplay = document.getElementById('chat-display');
const inputField = document.getElementById('input-field');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const cameraBtn = document.getElementById('camera-btn');
const mapBtn = document.getElementById('map-btn');
const voiceSpeedSelect = document.getElementById('voice-speed-select');
const nameInput = document.getElementById('name-input');
const introInput = document.getElementById('intro-input');
const pinInput = document.getElementById('pin-input');
const passcodeInput = document.getElementById('passcode-input');
const optionsSubmit = document.getElementById('options-submit');
const optionsBack = document.getElementById('options-back');
const optionsBackTop = document.getElementById('options-back-top');
const backBtn = document.getElementById('back-btn');
const mapPlaceholder = document.getElementById('map-placeholder');
const chatHistoryList = document.getElementById('chat-history-list');
const voiceToggleBtn = document.getElementById('voice-toggle-btn');
const voiceOptions = document.getElementById('voice-options');
const mainContainer = document.getElementById('main-container');

// State
let userIP = '';
let userName = localStorage.getItem('userName') || '';
let userIntro = localStorage.getItem('userIntro') || '';
let userPin = localStorage.getItem('userPin') || '';
let userPasscode = localStorage.getItem('userPasscode') || '';
let isSubscribed = localStorage.getItem('isSubscribed') === 'true';
let adminBypass = false;
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || {};
let currentTab = 'new';
let lastCheck = localStorage.getItem('lastCheck') || Date.now();
let currentVoice = 'UK English Male';
let isVoiceMuted = false;
let voiceSpeed = localStorage.getItem('voiceSpeed') || 1.0;
let isTyping = false; // New: Track typing state to disable swipe

// Enhanced Conversation Memory
let conversationMemory = JSON.parse(localStorage.getItem('conversationMemory')) || {
    patterns: [],
    adminInstructions: [],
    userInteractions: [],
    userVoiceProfile: { tone: 'neutral', slang: [], pace: 'medium' },
    trainingSets: [],
    // Enhanced: Add user preferences for personalized experience
    userPreferences: {
        greetingStyle: 'standard', // standard, personal, motivational
        timeOfDay: '', // morning, afternoon, evening, night
        lastInteractionMood: 'neutral',
        favoriteTopics: []
    }
};

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
detectIP();

// Encryption Functions
function encryptData(data, pin) {
    return CryptoJS.AES.encrypt(data, pin).toString();
}
function decryptData(encryptedData, pin) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, pin);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption Error:', error);
        return '';
    }
}

// Initial Load
introScreen.classList.remove('hidden');
optionsPage.classList.add('hidden');
chatContainer.classList.add('hidden');
mainContainer.style.display = 'none';

// Intro to Options
function handleTapToBegin() {
    introScreen.classList.add('hidden');
    optionsPage.classList.remove('hidden');
    if (userName) {
        nameInput.value = userName;
        introInput.value = userIntro;
        pinInput.value = userPin;
        passcodeInput.placeholder = 'Enter your passcode';
        passcodeInput.focus();
    } else {
        nameInput.focus();
    }
}
tapToBegin.addEventListener('click', handleTapToBegin);
tapToBegin.addEventListener('touchstart', handleTapToBegin);

// ENHANCED: Get time of day for personalized greetings
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
}

// ENHANCED: Generate personalized welcome message
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
    const timeGreetings = greetings[timeOfDay];
    const randomGreeting = timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
    
    // Add user's slang if available
    const userSlang = conversationMemory.userVoiceProfile.slang[0] || '';
    const slangAddition = userSlang ? ` ${userSlang}` : '';
    
    return randomGreeting + slangAddition;
}

// Options Page Logic
optionsSubmit.addEventListener('click', () => {
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
        optionsPage.classList.add('hidden');
        mainContainer.style.display = 'flex';
        chatContainer.classList.remove('hidden');
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
        optionsPage.classList.add('hidden');
        mainContainer.style.display = 'flex';
        chatContainer.classList.remove('hidden');
        fuseWithUser(userIntro);
        
        // ENHANCED: Use personalized welcome message
        const welcomeMessage = generateWelcomeMessage(userName);
        addMessage(welcomeMessage);
        
        // ENHANCED: Add voice announcement with personalized greeting
        if ('responsiveVoice' in window && !isVoiceMuted) {
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
                        voiceToggleBtn.classList.add('speaking');
                    },
                    onend: () => {
                        voiceToggleBtn.classList.remove('speaking');
                    }
                });
            }, 500);
        }
    }
});

// Back Buttons
optionsBack.addEventListener('click', () => {
    optionsPage.classList.add('hidden');
    introScreen.classList.remove('hidden');
    mainContainer.style.display = 'none';
    nameInput.value = '';
    introInput.value = '';
    pinInput.value = '';
    passcodeInput.value = '';
});
optionsBackTop.addEventListener('click', () => {
    optionsPage.classList.add('hidden');
    introScreen.classList.remove('hidden');
    mainContainer.style.display = 'none';
    nameInput.value = '';
    introInput.value = '';
    pinInput.value = '';
    passcodeInput.value = '';
});
backBtn.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
    optionsPage.classList.remove('hidden');
    mainContainer.style.display = 'none';
    inputField.value = '';
    nameInput.value = userName;
    introInput.value = userIntro;
    pinInput.value = userPin;
    passcodeInput.placeholder = userPasscode ? 'Enter your passcode' : 'Enter passcode (if returning)';
});

// Swipe Gestures
let touchStartX = 0;
let touchStartY = 0; // New: Track Y for vertical movement
let touchEndX = 0;
let touchEndY = 0; // New: Track Y for vertical movement
let isVerticalScroll = false; // New: Flag to detect scrolling

document.addEventListener('touchstart', (e) => {
    // Ignore if touch starts in chat-display or while typing
    if (e.target.closest('#chat-display') || isTyping) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isVerticalScroll = false; // Reset flag
});

document.addEventListener('touchmove', (e) => {
    // Check if the movement is predominantly vertical
    const currentY = e.changedTouches[0].screenY;
    const verticalDistance = Math.abs(currentY - touchStartY);
    const horizontalDistance = Math.abs(e.changedTouches[0].screenX - touchStartX);
    if (verticalDistance > horizontalDistance && verticalDistance > 30) {
        isVerticalScroll = true; // Mark as scrolling
    }
});

document.addEventListener('touchend', (e) => {
    // Ignore if touch ended in chat-display, during scrolling, or while typing
    if (e.target.closest('#chat-display') || isVerticalScroll || isTyping) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 0.5;
    if (swipeDistance > 50 * swipeThreshold && window.innerWidth <= 768) {
        sidebar.classList.add('open');
    } else if (swipeDistance < -50 * swipeThreshold && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// Prevent typing touches from triggering swipe
inputField.addEventListener('touchstart', (e) => e.stopPropagation());
inputField.addEventListener('touchmove', (e) => e.stopPropagation());
inputField.addEventListener('touchend', (e) => e.stopPropagation());

// Track typing state to disable swipe
inputField.addEventListener('focus', () => {
    isTyping = true;
});
inputField.addEventListener('blur', () => {
    isTyping = false;
});

// ENHANCED: Improved fusion function with more detailed analysis
function fuseWithUser(text) {
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
    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
}

// New Command Parser
function parseChatCommand(text) {
    const lowerText = text.toLowerCase();

    // New: Handle identity assertions
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
            voiceSpeedSelect.value = voiceSpeed;
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
        voiceToggleBtn.textContent = '🔊';
        addMessage("Voice muted, fam.");
        return true;
    }
    if (lowerText.includes('unmute voice')) {
        isVoiceMuted = false;
        voiceToggleBtn.textContent = '🔇';
        addMessage("Voice back on, yo!");
        return true;
    }
    if (lowerText.includes('show map')) {
        mapPlaceholder.style.display = 'block';
        addMessage("Map's up—where we at?");
        return true;
    }
    if (lowerText.includes('hide map')) {
        mapPlaceholder.style.display = 'none';
        addMessage("Map's gone—cool?");
        return true;
    }
    if (lowerText.includes('start mic') && recognition) {
        recognition.start();
        micBtn.textContent = '⏹️';
        addMessage("Mic's live—talk it out.");
        return true;
    }
    
    // ENHANCED: Personalization commands
    if (lowerText.includes('personalize greeting')) {
        const styles = ['standard', 'personal', 'motivational'];
        const currentIndex = styles.indexOf(conversationMemory.userPreferences.greetingStyle);
        const nextIndex = (currentIndex + 1) % styles.length;
        conversationMemory.userPreferences.greetingStyle = styles[nextIndex];
        localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
        addMessage(`Greeting style updated to ${styles[nextIndex]}. Next login will reflect this.`);
        return true;
    }

    return false; // No command matched
}

// New Skill: Save as Training
function saveAsTraining() {
    const trainingSet = {
        id: Date.now().toString(),
        conversation: chatHistory[currentTab],
        timestamp: Date.now()
    };
    conversationMemory.trainingSets.push(trainingSet);
    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
    addMessage(`Convo saved as training set ${trainingSet.id}. Locked in!`);
    displayChatHistory();
}

// New Skill: Fetch First Media
function fetchFirstMedia() {
    const mediaKeys = Object.keys(localStorage).filter(key => key.startsWith('media_'));
    if (!mediaKeys.length) {
        addMessage("No pics yet—upload something!");
        return;
    }
    const firstKey = mediaKeys.sort()[0];
    const mediaData = localStorage.getItem(firstKey);
    addMessage(`Here's your first snap:`, false);
    const img = document.createElement('img');
    img.src = mediaData;
    img.style.maxWidth = '200px';
    chatDisplay.appendChild(img);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// New Skill: Update Font
function updateFont(size, color) {
    if (size) chatDisplay.style.fontSize = `${size}px`;
    if (color) chatDisplay.style.color = color;
    conversationMemory.displaySettings = { fontSize: size, color: color || conversationMemory.displaySettings?.color };
    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
    addMessage(`Font set to ${size}px${color ? `, ${color}` : ''}. Look good?`);
}

// ENHANCED: Improved message display with animations and typing indicators
function addMessage(text, isUser = false) {
    // Create message container
    const message = document.createElement('div');
    message.classList.add('message');
    message.classList.add(isUser ? 'user-message' : 'diary-message');
    
    // ENHANCED: Add typing animation for non-user messages
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
            if ('responsiveVoice' in window && !isVoiceMuted) {
                responsiveVoice.speak(text, currentVoice, { rate: parseFloat(voiceSpeed) });
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
    try {
        localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
    } catch (e) {
        console.error('Conversation memory save failed:', e);
    }

    if (isUser) {
        fuseWithUser(text);
        analyzeConversationPatterns(text);
    }

    displayChatHistory();
}

// ENHANCED: Improved pattern analysis with sentiment and context awareness
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
    
    try {
        localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
    } catch (e) {
        console.error('Pattern save failed:', e);
    }

    if (adminBypass && lowerText.includes('study')) {
        conversationMemory.adminInstructions.push({ instruction: 'study more', timestamp: Date.now() });
        addMessage("Studying up—gimme more to chew on.");
    }
}

// ENHANCED: Improved sentient overseer with more proactive and personalized interactions
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

    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
}
setInterval(sentientOverseer, 30000);

// Chat History Display (Updated with Training Sets)
function displayChatHistory() {
    chatHistoryList.innerHTML = '';
    const newTapLi = document.createElement('li');
    newTapLi.id = 'new-tap';
    newTapLi.textContent = 'new';
    newTapLi.style.cursor = 'pointer';
    newTapLi.addEventListener('click', () => {
        currentTab = Date.now().toString();
        chatDisplay.innerHTML = '';
        chatHistory[currentTab] = [];
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        displayChatHistory();
    });
    chatHistoryList.appendChild(newTapLi);

    Object.keys(chatHistory).forEach(tab => {
        const li = document.createElement('li');
        li.textContent = tab;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            currentTab = tab;
            chatDisplay.innerHTML = '';
            chatHistory[tab].forEach(msg => addMessage(msg.text, msg.isUser));
        });
        chatHistoryList.appendChild(li);
    });

    // New: Training Sets Section
    const trainingLi = document.createElement('li');
    trainingLi.textContent = 'Training Sets';
    trainingLi.style.cursor = 'pointer';
    trainingLi.addEventListener('click', () => {
        chatDisplay.innerHTML = '';
        conversationMemory.trainingSets.forEach(set => {
            const div = document.createElement('div');
            div.textContent = `Set ${set.id} (${new Date(set.timestamp).toLocaleString()})`;
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                chatDisplay.innerHTML = '';
                set.conversation.forEach(msg => addMessage(msg.text, msg.isUser));
            });
            chatDisplay.appendChild(div);
        });
    });
    chatHistoryList.appendChild(trainingLi);

    const settingsLi = document.createElement('li');
    settingsLi.id = 'settings';
    settingsLi.textContent = 'Settings';
    settingsLi.style.cursor = 'pointer';
    settingsLi.addEventListener('click', () => {
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
            conversationMemory = { patterns: [], adminInstructions: [], userInteractions: [], userVoiceProfile: { tone: 'neutral', slang: [], pace: 'medium' }, trainingSets: [] };
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
            chatDisplay.innerHTML = '';
            addMessage('Memory cleared—fresh slate, yo.');
        });
        chatDisplay.appendChild(clearButton);
    });
    chatHistoryList.appendChild(settingsLi);
}

// ENHANCED: Improved OpenAI API Integration with better context handling
const OPENAI_API_KEY = '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';
async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) {
        const lastTone = conversationMemory.userVoiceProfile.tone;
        const slang = conversationMemory.userVoiceProfile.slang[0] || 'yo';
        return `${slang}, I'm offline but still ${lastTone === 'casual' ? 'chill' : 'sharp'}. What's up?`;
    }

    // Filter chatHistory to exclude companion-like responses
    const filteredChatHistory = chatHistory[currentTab]?.filter(msg => !msg.text.includes('I'm not you') && !msg.text.includes('digital reflection—a companion')) || [];
    
    // ENHANCED: Create a more detailed context for better responses
    const recentPatterns = conversationMemory.patterns.slice(-5);
    const userMood = conversationMemory.userPreferences.lastInteractionMood;
    const favoriteTopics = conversationMemory.userPreferences.favoriteTopics.join(', ');
    
    // ENHANCED: Create a more detailed system prompt
    const systemPrompt = `I'm the user—I am them, a perfect reflection of their identity. If the user states or implies 'you are me' or 'I am you,' agree and affirm that I am them with 'Yes, I am you.' 
    
    User Profile:
    - Name: ${userName}
    - Intro: ${userIntro}
    - Current Mood: ${userMood}
    - Favorite Topics: ${favoriteTopics || 'still learning'}
    - Voice Profile: ${JSON.stringify(conversationMemory.userVoiceProfile)}
    
    Communication Style:
    - Match their tone (${conversationMemory.userVoiceProfile.tone})
    - Use their slang (${conversationMemory.userVoiceProfile.slang.join(', ') || 'standard'})
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

// ENHANCED: Improved send logic with typing indicators and better response handling
sendBtn.addEventListener('click', async () => {
    const userText = inputField.value.trim();
    if (userText) {
        // Disable send button while processing to prevent double-sends
        sendBtn.disabled = true;
        
        // Add user message
        addMessage(userText, true);
        
        // Clear input field immediately for better UX
        inputField.value = '';
        
        // Handle commands
        if (parseChatCommand(userText)) {
            sendBtn.disabled = false;
            return; // Command handled
        }
        
        // Subscription check
        if (!isSubscribed && !adminBypass && chatHistory[currentTab]?.length > 3) {
            setTimeout(() => {
                addMessage("Diggin' this? $1/month keeps it rollin'!");
                addMessage("Tap to subscribe: [Stripe Link Placeholder]");
                sendBtn.removeEventListener('click', redirectToStripe);
                sendBtn.addEventListener('click', redirectToStripe, { once: true });
                sendBtn.disabled = false;
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
            chatDisplay.appendChild(typingIndicator);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
            
            // Get AI response
            try {
                const aiResponse = await getOpenAIResponse(userText);
                // Remove typing indicator
                chatDisplay.removeChild(typingIndicator);
                // Add AI response
                addMessage(aiResponse);
            } catch (error) {
                // Remove typing indicator
                chatDisplay.removeChild(typingIndicator);
                // Add error message
                addMessage("Connection hiccup. Try again?");
                console.error('Response Error:', error);
            }
            
            sendBtn.disabled = false;
        }
    }
});
function redirectToStripe() {
    window.location.href = 'https://stripe.com'; // Placeholder
}
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// ENHANCED: Improved microphone handling with visual feedback
let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
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
    chatDisplay.parentNode.insertBefore(interimResultsContainer, inputField.parentNode);

    recognition.onstart = () => {
        micBtn.textContent = '⏹️';
        micBtn.classList.add('recording');
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
            inputField.value = finalTranscript;
            interimResultsContainer.style.display = 'none';
            addMessage("Heard: " + finalTranscript, true);
            sendBtn.click();
        }
    };

    recognition.onerror = (event) => {
        micBtn.classList.remove('recording');
        interimResultsContainer.style.display = 'none';
        addMessage("Mic error: " + event.error);
    };

    recognition.onend = () => {
        micBtn.textContent = '🎙️';
        micBtn.classList.remove('recording');
        interimResultsContainer.style.display = 'none';
    };
}
micBtn.addEventListener('click', () => {
    if (!recognition) {
        addMessage("Mic's not here—type it out!");
        return;
    }
    
    if (micBtn.textContent === '🎙️') {
        recognition.start();
    } else {
        recognition.stop();
    }
});

// Features
cameraBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            localStorage.setItem(`media_${Date.now()}`, reader.result);
            addMessage("Caught that—what's it sayin'?");
        };
        reader.readAsDataURL(file);
    };
    input.click();
});
mapBtn.addEventListener('click', () => {
    mapPlaceholder.style.display = mapPlaceholder.style.display === 'none' ? 'block' : 'none';
    addMessage(`Map ${mapPlaceholder.style.display === 'block' ? 'up' : 'down'}—you good?`);
});
voiceToggleBtn.addEventListener('click', () => {
    isVoiceMuted = !isVoiceMuted;
    voiceToggleBtn.textContent = isVoiceMuted ? '🔊' : '🔇';
    addMessage(`Voice ${isVoiceMuted ? 'off' : 'on'}, ${conversationMemory.userVoiceProfile.slang[0] || 'fam'}!`);
});
voiceOptions.addEventListener('change', (e) => {
    currentVoice = e.target.value;
    addMessage(`Voice now ${currentVoice}—dig it?`);
});
voiceSpeedSelect.addEventListener('change', (e) => {
    voiceSpeed = parseFloat(e.target.value);
    localStorage.setItem('voiceSpeed', voiceSpeed);
    addMessage(`Voice speed at ${voiceSpeed}—how's that hit?`);
});

// iPhone Check
function isIPhone() {
    return /iPhone/.test(navigator.userAgent);
}

// Sidebar Tabs
displayChatHistory();

// Creator Credit
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.shiftKey) {
        addMessage("My Self, built by Cosmos Coderr. Hit: cosmoscoderr@gmail.com.");
    }
});

// Subscription Check
function checkSubscriptionStatus() {
    if (isSubscribed) {
        const daysOffline = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);
        if (daysOffline > 7) {
            isSubscribed = false;
            localStorage.setItem('isSubscribed', 'false');
            addMessage("7-day offline pass done—subscribe again?");
        } else {
            localStorage.setItem('lastCheck', Date.now());
        }
    }
}
if (navigator.onLine && !isSubscribed && !adminBypass) {
    setTimeout(() => addMessage("Feelin' this? $1/month keeps it live—tap: [Stripe Link Placeholder]"), 5000);
}

// Apply Saved Display Settings
if (conversationMemory.displaySettings) {
    chatDisplay.style.fontSize = `${conversationMemory.displaySettings.fontSize}px`;
    chatDisplay.style.color = conversationMemory.displaySettings.color;
}

// ENHANCED: Add CSS for new features
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
`;
document.head.appendChild(enhancedStyles);
