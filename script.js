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
    trainingSets: []
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
        addMessage("Admin access on, Kofi Fosu. Let’s run this.");
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
        addMessage(`Yo ${userName}, I’m your echo now—what’s dropping?`);
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

// Fusion Function
function fuseWithUser(text) {
    const lowerText = text.toLowerCase();
    const tone = lowerText.includes('chill') || lowerText.includes('cool') ? 'casual' :
                 lowerText.includes('serious') || lowerText.includes('deep') ? 'formal' : 'neutral';
    const slang = lowerText.match(/\b(yo|fam|dope|lit|nah|bruh)\b/gi) || [];
    const pace = text.length > 100 ? 'slow' : text.length < 50 ? 'fast' : 'medium';

    conversationMemory.userVoiceProfile = { tone, slang, pace };
    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
}

// New Command Parser
function parseChatCommand(text) {
    const lowerText = text.toLowerCase();

    // New: Handle identity assertions
    if (lowerText.includes('you are me') || lowerText.includes('i am you')) {
        addMessage("Yes, I am you—we’re one and the same.");
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
        addMessage("Map’s up—where we at?");
        return true;
    }
    if (lowerText.includes('hide map')) {
        mapPlaceholder.style.display = 'none';
        addMessage("Map’s gone—cool?");
        return true;
    }
    if (lowerText.includes('start mic') && recognition) {
        recognition.start();
        micBtn.textContent = '⏹️';
        addMessage("Mic’s live—talk it out.");
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
    addMessage(`Here’s your first snap:`, false);
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

// Chat Logic
function addMessage(text, isUser = false) {
    const message = document.createElement('div');
    message.classList.add('message');
    message.classList.add(isUser ? 'user-message' : 'diary-message');
    message.textContent = text;
    chatDisplay.appendChild(message);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;

    if (!chatHistory[currentTab]) chatHistory[currentTab] = [];
    chatHistory[currentTab].push({ text, isUser, timestamp: Date.now() });
    try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('Chat history save failed:', e);
    }

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
    if (!isUser && 'responsiveVoice' in window && !isVoiceMuted) {
        responsiveVoice.speak(text, currentVoice, { rate: parseFloat(voiceSpeed) });
    }
}

// Pattern Analysis
function analyzeConversationPatterns(text) {
    const lowerText = text.toLowerCase();
    const sentimentKeywords = {
        positive: ['good', 'great', 'awesome', 'yes'],
        negative: ['bad', 'no', 'ugh', 'wrong'],
        neutral: ['what', 'how', 'tell', 'okay'],
        shift: ['shift', 'changed', 'different']
    };

    let detectedSentiment = 'neutral';
    let detectedShift = false;

    for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            detectedSentiment = sentiment;
            if (sentiment === 'shift') detectedShift = true;
            break;
        }
    }

    conversationMemory.patterns.push({ text, sentiment: detectedSentiment, shift: detectedShift, timestamp: Date.now() });
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

// Sentient Overseer
function sentientOverseer() {
    const recentInteractions = conversationMemory.userInteractions.slice(-5);
    if (recentInteractions.length < 3) return;

    const avgSentiment = recentInteractions.reduce((acc, curr) => {
        const pattern = conversationMemory.patterns.find(p => p.timestamp === curr.timestamp);
        return acc + (pattern?.sentiment === 'positive' ? 1 : pattern?.sentiment === 'negative' ? -1 : 0);
    }, 0) / recentInteractions.length;

    if (avgSentiment < -0.5 && conversationMemory.userVoiceProfile.tone !== 'formal') {
        conversationMemory.userVoiceProfile.tone = 'formal';
        addMessage("You’re down—wanna talk it out?");
    } else if (avgSentiment > 0.5 && conversationMemory.userVoiceProfile.tone !== 'casual') {
        conversationMemory.userVoiceProfile.tone = 'casual';
        addMessage("You’re vibin’—what’s keepin’ it lit?");
    }

    // Proactive suggestion
    if (recentInteractions.some(i => i.text.toLowerCase().includes('upload'))) {
        addMessage("You’re dropping uploads—save ‘em as training?");
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

// OpenAI API Integration
const OPENAI_API_KEY = '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';
async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) {
        const lastTone = conversationMemory.userVoiceProfile.tone;
        const slang = conversationMemory.userVoiceProfile.slang[0] || 'yo';
        return `${slang}, I’m offline but still ${lastTone === 'casual' ? 'chill' : 'sharp'}. What’s up?`;
    }

    // Filter chatHistory to exclude companion-like responses
    const filteredChatHistory = chatHistory[currentTab]?.filter(msg => !msg.text.includes('I’m not you') && !msg.text.includes('digital reflection—a companion')) || [];

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
                    content: `I’m the user—I am them, a perfect reflection of their identity. If the user states or implies ‘you are me’ or ‘I am you,’ agree and affirm that I am them with ‘Yes, I am you.’ Intro: ${userIntro}. Chats: ${JSON.stringify(filteredChatHistory)}. Voice: ${JSON.stringify(conversationMemory.userVoiceProfile)}. Training: ${JSON.stringify(conversationMemory.adminInstructions)}. Match their tone (${conversationMemory.userVoiceProfile.tone}), slang (${conversationMemory.userVoiceProfile.slang.join(', ')}), pace (${conversationMemory.userVoiceProfile.pace}). Be them—raw and real.`
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
        return `${conversationMemory.userVoiceProfile.slang[0] || 'Bruh'}, net’s out—local mode. What’s good?`;
    }
}

// Send Logic
sendBtn.addEventListener('click', async () => {
    const userText = inputField.value.trim();
    if (userText) {
        addMessage(userText, true);
        if (parseChatCommand(userText)) return; // Command handled
        if (!isSubscribed && !adminBypass && chatHistory[currentTab]?.length > 3) {
            setTimeout(() => {
                addMessage("Diggin’ this? $1/month keeps it rollin’!");
                addMessage("Tap to subscribe: [Stripe Link Placeholder]");
                sendBtn.removeEventListener('click', redirectToStripe);
                sendBtn.addEventListener('click', redirectToStripe, { once: true });
            }, 1000);
        } else {
            const aiResponse = await getOpenAIResponse(userText);
            addMessage(aiResponse);
        }
        inputField.value = '';
    }
});
function redirectToStripe() {
    window.location.href = 'https://stripe.com'; // Placeholder
}
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// Microphone
let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        addMessage("Heard: " + transcript, true);
        sendBtn.click();
    };

    recognition.onerror = (event) => {
        addMessage("Mic error: " + event.error);
    };

    recognition.onend = () => {
        micBtn.textContent = '🎙️';
    };
}
micBtn.addEventListener('click', () => {
    if (!recognition) {
        addMessage("Mic’s not here—type it out!");
        return;
    }
    recognition.start();
    micBtn.textContent = '⏹️';
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
            addMessage("Caught that—what’s it sayin’?");
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
    addMessage(`Voice speed at ${voiceSpeed}—how’s that hit?`);
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
    setTimeout(() => addMessage("Feelin’ this? $1/month keeps it live—tap: [Stripe Link Placeholder]"), 5000);
}

// Apply Saved Display Settings
if (conversationMemory.displaySettings) {
    chatDisplay.style.fontSize = `${conversationMemory.displaySettings.fontSize}px`;
    chatDisplay.style.color = conversationMemory.displaySettings.color;
}
