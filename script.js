// Core Elements (unchanged DOM refs for brevity)
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

// Enhanced Conversation Memory
let conversationMemory = JSON.parse(localStorage.getItem('conversationMemory')) || {
    patterns: [], // Sentiment, topics, shifts
    adminInstructions: [], // Training commands
    userInteractions: [], // Raw inputs
    userVoiceProfile: { tone: 'neutral', slang: [], pace: 'medium' } // Dynamic user mimicry
};

// IP Detection (unchanged)
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

// Encryption Functions (unchanged)
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

// Initial Load (unchanged)
introScreen.classList.remove('hidden');
optionsPage.classList.add('hidden');
chatContainer.classList.add('hidden');
mainContainer.style.display = 'none';

// Intro to Options (unchanged)
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

// Options Page Logic (tweaked for fusion kickoff)
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
        addMessage("Admin access on, Kofi Fosu. Let’s tweak this beast.");
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
            addMessage(`Passcode locked in: ${userPasscode}. You’re set!`);
        }
        optionsPage.classList.add('hidden');
        mainContainer.style.display = 'flex';
        chatContainer.classList.remove('hidden');
        fuseWithUser(userIntro); // Kick off fusion
        addMessage(`Yo ${userName}, I’m you now—spit what’s real.`);
    }
});

// Back Buttons (unchanged)
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

// Swipe Gestures (unchanged)
let touchStartX = 0;
let touchEndX = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
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

// New Fusion Function
function fuseWithUser(text) {
    const lowerText = text.toLowerCase();
    const tone = lowerText.includes('chill') || lowerText.includes('cool') ? 'casual' :
                 lowerText.includes('serious') || lowerText.includes('deep') ? 'formal' : 'neutral';
    const slang = lowerText.match(/\b(yo|fam|dope|lit|nah|bruh)\b/gi) || [];
    const pace = text.length > 100 ? 'slow' : text.length < 50 ? 'fast' : 'medium';

    conversationMemory.userVoiceProfile = { tone, slang, pace };
    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
}

// Improved Chat Logic
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
        fuseWithUser(text); // Update fusion on every input
        analyzeConversationPatterns(text);
    }

    displayChatHistory();
    if (!isUser && 'responsiveVoice' in window && !isVoiceMuted) {
        responsiveVoice.speak(text, currentVoice, { rate: conversationMemory.userVoiceProfile.pace === 'fast' ? 1.2 : 0.9 });
    }
}

// Enhanced Pattern Analysis
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
        addMessage("Locked in—studying harder now.");
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
        addMessage("You’re vibin’ low—let’s dig into it, yeah?");
    } else if (avgSentiment > 0.5 && conversationMemory.userVoiceProfile.tone !== 'casual') {
        conversationMemory.userVoiceProfile.tone = 'casual';
        addMessage("You’re lit up—keep it rollin’, fam!");
    }

    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
}
setInterval(sentientOverseer, 30000); // Runs every 30 seconds

// Chat History Display (unchanged)
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
            conversationMemory = { patterns: [], adminInstructions: [], userInteractions: [], userVoiceProfile: { tone: 'neutral', slang: [], pace: 'medium' } };
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
            chatDisplay.innerHTML = '';
            addMessage('Memory wiped—fresh start, fam.');
        });
        chatDisplay.appendChild(clearButton);
    });
    chatHistoryList.appendChild(settingsLi);
}

// Enhanced OpenAI API Integration
const OPENAI_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your key
async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) {
        const lastTone = conversationMemory.userVoiceProfile.tone;
        const slang = conversationMemory.userVoiceProfile.slang[0] || 'yo';
        return `${slang}, I’m offline but still ${lastTone === 'casual' ? 'chill' : 'sharp'}. What’s hittin’ you?`;
    }

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
                    content: `I’m the user’s living diary—fuse with them. Their intro: ${userIntro}. Past chats: ${JSON.stringify(chatHistory[currentTab])}. Voice profile: ${JSON.stringify(conversationMemory.userVoiceProfile)}. Training: ${JSON.stringify(conversationMemory.adminInstructions)}. Match their tone (${conversationMemory.userVoiceProfile.tone}), slang (${conversationMemory.userVoiceProfile.slang.join(', ')}), and pace (${conversationMemory.userVoiceProfile.pace}). Be raw, real, and them—don’t just respond, *be* them.`
                }, {
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 500 // Upped for flow
            })
        });

        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('API Error:', error);
        return `${conversationMemory.userVoiceProfile.slang[0] || 'Bruh'}, net’s down—talk local. What’s good?`;
    }
}

// Send Logic (unchanged structure, tied to new functions)
sendBtn.addEventListener('click', async () => {
    const userText = inputField.value.trim();
    if (userText) {
        addMessage(userText, true);
        if (!isSubscribed && !adminBypass && chatHistory[currentTab]?.length > 3) {
            setTimeout(() => {
                addMessage("Diggin’ this? $1/month keeps it live!");
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

// Microphone (unchanged)
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
        addMessage("Mic’s dead here—type it out!");
        return;
    }
    recognition.start();
    micBtn.textContent = '⏹️';
});

// Camera, Map, Voice Toggle, Options (unchanged)
cameraBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            localStorage.setItem(`media_${Date.now()}`, reader.result);
            addMessage("Snagged that—what’s the word?");
        };
        reader.readAsDataURL(file);
    };
    input.click();
});
mapBtn.addEventListener('click', () => {
    mapPlaceholder.style.display = mapPlaceholder.style.display === 'none' ? 'block' : 'none';
});
voiceToggleBtn.addEventListener('click', () => {
    isVoiceMuted = !isVoiceMuted;
    voiceToggleBtn.textContent = isVoiceMuted ? '🔊' : '🔇';
    addMessage(`Voice ${isVoiceMuted ? 'off' : 'on'}, ${conversationMemory.userVoiceProfile.slang[0] || 'fam'}!`);
});
voiceOptions.addEventListener('change', (e) => {
    currentVoice = e.target.value;
    addMessage(`Voice flipped to ${currentVoice}—you feelin’ it?`);
});

// iPhone Check (unchanged)
function isIPhone() {
    return /iPhone/.test(navigator.userAgent);
}

// Sidebar Tabs (unchanged)
displayChatHistory();

// Creator Credit (unchanged)
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.shiftKey) {
        addMessage("My Self, crafted by Cosmos Coderr. Hit: cosmoscoderr@gmail.com.");
    }
});

// Subscription Check (unchanged)
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
    setTimeout(() => addMessage("Feelin’ this? $1/month keeps it poppin’—tap: [Stripe Link Placeholder]"), 5000);
}
