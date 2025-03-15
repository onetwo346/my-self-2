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
let currentVoice = 'UK English Male'; // Default voice
let isVoiceMuted = false;

// IP Detection
async function detectIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
    } catch (error) {
        userIP = '192.168.1.100'; // Fallback for offline mode
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
    const bytes = CryptoJS.AES.decrypt(encryptedData, pin);
    return bytes.toString(CryptoJS.enc.Utf8);
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
        addMessage("Admin access on, Kofi Fosu. What’s good?");
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
            addMessage(`Passcode for all your devices: ${userPasscode}. Lock it down!`);
        }
        optionsPage.classList.add('hidden');
        mainContainer.style.display = 'flex';
        chatContainer.classList.remove('hidden');
        addMessage(`Yo ${userName}, I’m My Self—your digital echo. What’s dropping?`);
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

// Swipe Gestures with Adjusted Sensitivity
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
    const swipeThreshold = 0.5; // Adjusted to 0.5 for smoother texting on iPhone
    if (swipeDistance > 50 * swipeThreshold && window.innerWidth <= 768) {
        sidebar.classList.add('open');
    } else if (swipeDistance < -50 * swipeThreshold && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// Chat Logic with Sidebar History
function addMessage(text, isUser = false) {
    const message = document.createElement('div');
    message.classList.add('message');
    message.classList.add(isUser ? 'user-message' : 'diary-message');
    message.textContent = text;
    chatDisplay.appendChild(message);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;

    if (!chatHistory[currentTab]) chatHistory[currentTab] = [];
    chatHistory[currentTab].push({ text, isUser });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    displayChatHistory();

    if (!isUser && 'responsiveVoice' in window && !isVoiceMuted) {
        responsiveVoice.speak(text, currentVoice, { rate: 1.0 });
    }
}

function getAllConversations() {
    return chatHistory;
}

function displayChatHistory() {
    chatHistoryList.innerHTML = '';
    Object.keys(chatHistory).forEach(tab => {
        const li = document.createElement('li');
        li.textContent = tab; // Raw timestamp as label
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            currentTab = tab;
            chatDisplay.innerHTML = '';
            chatHistory[tab].forEach(msg => addMessage(msg.text, msg.isUser));
        });
        chatHistoryList.appendChild(li);
    });
}

// OpenAI API Integration
const OPENAI_API_KEY = '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';

async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) {
        return "Offline, but I got you. What’s hitting you today?";
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
                    content: `I’m My Self, your digital diary with a pulse. I know you from: ${userIntro}. Past chats: ${JSON.stringify(chatHistory[currentTab])}. I bring self-awareness, emotional intelligence, foresight, metacognition, communication, research, adaptability, decision-making, systems thinking, creativity, critical thinking, designing, and homework-solving. Keep it raw, real, and sharp—reflect what they throw at me.`
                }, {
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 150
            })
        });

        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('API Error:', error);
        return "Connection’s down—let’s roll local. What’s up?";
    }
}

sendBtn.addEventListener('click', async () => {
    const userText = inputField.value.trim();
    if (userText) {
        addMessage(userText, true);
        if (!isSubscribed && !adminBypass && chatHistory[currentTab]?.length > 3) {
            setTimeout(() => {
                addMessage("You into this? $1/month keeps it flowing!");
                addMessage("Tap to subscribe: [Stripe Link Placeholder]");
                sendBtn.addEventListener('click', redirectToStripe, { once: true });
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

// Microphone Functionality
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
        addMessage("Mic not supported on this browser—type it out!");
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

// iPhone and Laptop Feature Consistency
function isIPhone() {
    return /iPhone/.test(navigator.userAgent);
}

function renderFeatures() {
    mapPlaceholder.style.display = 'block'; // Always visible on both devices
    voiceOptions.style.display = 'block'; // Show voice options on both devices
    voiceOptions.addEventListener('change', (e) => {
        currentVoice = e.target.value;
        addMessage(`Voice set to ${currentVoice}!`);
    });
}

if (isIPhone() || window.innerWidth > 768) {
    renderFeatures();
}

// Voice Toggle (Mute Button)
voiceToggleBtn.addEventListener('click', () => {
    isVoiceMuted = !isVoiceMuted;
    voiceToggleBtn.textContent = isVoiceMuted ? '🔊' : '🔇';
    addMessage(`Voice ${isVoiceMuted ? 'muted' : 'unmuted'}`);
});

// Sidebar Tabs
document.getElementById('new-tap').addEventListener('click', () => {
    currentTab = Date.now().toString(); // Unique tab for each new conversation
    chatDisplay.innerHTML = '';
    chatHistory[currentTab] = []; // Initialize new conversation
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    displayChatHistory();
});

document.getElementById('settings').addEventListener('click', () => {
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
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        chatDisplay.innerHTML = '';
        addMessage('Chat memory cleared!');
    });
    chatDisplay.appendChild(clearButton);
});

// Creator Credit
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.shiftKey) {
        addMessage("My Self, built by Cosmos Coderr. Hit him: cosmoscoderr@gmail.com.");
    }
});

// Subscription and Offline Grace
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
