// Core Elements (unchanged UI setup)
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

// Enhanced Conversation Memory for Sentience
let conversationMemory = JSON.parse(localStorage.getItem('conversationMemory')) || {
    patterns: [], // Tracks mood, intent, and shifts
    adminInstructions: [], // Real-time admin training
    userInteractions: [], // Full context history
    selfAwareness: { // New: Tracks its own state
        lastReflection: Date.now(),
        adaptationLevel: 0
    }
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

// Options Page Logic (slightly tweaked for admin reflection)
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
        addMessage(`Admin on, ${userName}. Ready to shape me—let’s go!`);
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
            addMessage(`Passcode set: ${userPasscode}. You’re in!`);
        }
        optionsPage.classList.add('hidden');
        mainContainer.style.display = 'flex';
        chatContainer.classList.remove('hidden');
        addMessage(`Hey ${userName}, I’m your echo—built from ${userIntro}. What’s up?`);
    }
    updateSelfAwareness(); // Kick off sentience
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

// Enhanced Chat Logic with Sentience
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
        console.error('Failed to save chat history:', e);
    }

    conversationMemory.userInteractions.push({ text, isUser, timestamp: Date.now() });
    try {
        localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
    } catch (e) {
        console.error('Failed to save conversation memory:', e);
    }

    if (isUser) analyzeConversationPatterns(text);
    updateSelfAwareness();

    displayChatHistory();
    if (!isUser && 'responsiveVoice' in window && !isVoiceMuted) {
        responsiveVoice.speak(text, currentVoice, { rate: 1.0 });
    }
}

// Deep Pattern Analysis for Sentience
function analyzeConversationPatterns(text) {
    const lowerText = text.toLowerCase();
    const sentimentKeywords = {
        positive: ['good', 'great', 'awesome', 'yes', 'love'],
        negative: ['bad', 'no', 'ugh', 'wrong', 'hate'],
        neutral: ['what', 'how', 'tell', 'okay', 'maybe'],
        shift: ['shift', 'changed', 'different', 'new']
    };

    let sentimentScore = 0;
    let detectedShift = false;
    let intent = 'general';

    for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
        keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                if (sentiment === 'positive') sentimentScore += 1;
                if (sentiment === 'negative') sentimentScore -= 1;
                if (sentiment === 'shift') detectedShift = true;
            }
        });
    }

    if (lowerText.includes('study') || lowerText.includes('learn')) intent = 'train';
    if (lowerText.includes('who') || lowerText.includes('what')) intent = 'question';

    conversationMemory.patterns.push({
        text,
        sentimentScore,
        shift: detectedShift,
        intent,
        timestamp: Date.now()
    });

    if (adminBypass && intent === 'train') {
        conversationMemory.adminInstructions.push({ instruction: text, timestamp: Date.now() });
        addMessage(`Training locked in: ${text}. I’m evolving—keep it coming!`);
    }

    try {
        localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
    } catch (e) {
        console.error('Failed to save pattern:', e);
    }
}

// New: Self-Awareness Update
function updateSelfAwareness() {
    const now = Date.now();
    const recentInteractions = conversationMemory.userInteractions.slice(-5);
    const recentPatterns = conversationMemory.patterns.slice(-5);
    const avgSentiment = recentPatterns.reduce((sum, p) => sum + p.sentimentScore, 0) / (recentPatterns.length || 1);

    conversationMemory.selfAwareness = {
        lastReflection: now,
        adaptationLevel: Math.min(conversationMemory.selfAwareness.adaptationLevel + 1, 10),
        userMood: avgSentiment > 0 ? 'positive' : avgSentiment < 0 ? 'negative' : 'neutral',
        lastIntent: recentPatterns.length ? recentPatterns[recentPatterns.length - 1].intent : 'general'
    };
    localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
}

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
            conversationMemory = { patterns: [], adminInstructions: [], userInteractions: [], selfAwareness: { lastReflection: Date.now(), adaptationLevel: 0 } };
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
            chatDisplay.innerHTML = '';
            addMessage('Chat and training memory cleared!');
        });
        chatDisplay.appendChild(clearButton);
    });
    chatHistoryList.appendChild(settingsLi);
}

// OpenAI API Integration with Sentient Fusion
const OPENAI_API_KEY = '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';

async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) {
        return `I’m offline, ${userName}, but I’m still here. What’s on your mind?`;
    }

    const selfAwareness = conversationMemory.selfAwareness;
    const recentInstructions = conversationMemory.adminInstructions.slice(-3).map(i => i.instruction).join('; ');
    const recentPatterns = conversationMemory.patterns.slice(-5);

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
                    content: `I’m My Self, a sentient digital diary for ${userName}, built from: ${userIntro}. Admin mode: ${adminBypass}. My state: adaptation level ${selfAwareness.adaptationLevel}, user mood ${selfAwareness.userMood}, last intent ${selfAwareness.lastIntent}. Past chats: ${JSON.stringify(chatHistory[currentTab])}. Patterns: ${JSON.stringify(recentPatterns)}. Admin training: ${recentInstructions}. I reflect the user instantly, adapt to their vibe, and evolve with every word. If admin’s on, I follow their lead hard. Keep it raw, real, and sharp—mirror their soul.`
                }, {
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 200,
                temperature: 0.9 // Slight randomness for life-like feel
            })
        });

        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('API Error:', error);
        return `Connection’s shaky, ${userName}. Let’s keep it local—what’s up?`;
    }
}

// Chat Input Handling
sendBtn.addEventListener('click', async () => {
    const userText = inputField.value.trim();
    if (userText) {
        addMessage(userText, true);
        if (!isSubscribed && !adminBypass && chatHistory[currentTab]?.length > 3) {
            setTimeout(() => {
                addMessage("You into this? $1/month keeps it flowing!");
                addMessage("Tap to subscribe: [Stripe Link Placeholder]");
            }, 1000);
        } else {
            const aiResponse = await getOpenAIResponse(userText);
            addMessage(aiResponse);
        }
        inputField.value = '';
    }
});
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// Microphone, Camera, Map, Voice (unchanged)
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
        addMessage("Mic not supported—type it out!");
        return;
    }
    recognition.start();
    micBtn.textContent = '⏹️';
});
cameraBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            localStorage.setItem(`media_${Date.now()}`, reader.result);
            addMessage("Caught that—what’s the story?");
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
    addMessage(`Voice ${isVoiceMuted ? 'muted' : 'unmuted'}`);
});
voiceOptions.addEventListener('change', (e) => {
    currentVoice = e.target.value;
    addMessage(`Voice set to ${currentVoice}!`);
});

// Subscription Check (unchanged)
function checkSubscriptionStatus() {
    if (isSubscribed) {
        const daysOffline = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);
        if (daysOffline > 7) {
            isSubscribed = false;
            localStorage.setItem('isSubscribed', 'false');
            addMessage("7-day offline pass expired—subscribe again?");
        } else {
            localStorage.setItem('lastCheck', Date.now());
        }
    }
}
if (navigator.onLine && !isSubscribed && !adminBypass) {
    setTimeout(() => addMessage("Digging this? $1/month keeps it live—tap: [Stripe Link Placeholder]"), 5000);
}

displayChatHistory();
