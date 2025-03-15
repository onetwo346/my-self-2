// Core Elements (unchanged)
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

// New State for Enhancements
let moodHistory = JSON.parse(localStorage.getItem('moodHistory')) || [];
let personalityTraits = { wit: 0, warmth: 0, curiosity: 0 }; // Evolving personality
let lastLetterTime = localStorage.getItem('lastLetterTime') || 0;

// IP Detection (unchanged)
async function detectIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
    } catch (error) {
        userIP = '192.168.1.100';
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
    const bytes = CryptoJS.AES.decrypt(encryptedData, pin);
    return bytes.toString(CryptoJS.enc.Utf8);
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

// Options Page Logic (unchanged)
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

// Enhanced Swipe Gestures (Smooth & Responsive)
let touchStartX = 0;
let touchCurrentX = 0;
let isSwiping = false;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    isSwiping = true;
    sidebar.style.transition = 'none'; // Disable transition during swipe
});

document.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    touchCurrentX = e.changedTouches[0].screenX;
    const deltaX = touchCurrentX - touchStartX;
    if (window.innerWidth <= 768) {
        sidebar.style.transform = `translateX(${Math.min(Math.max(deltaX, -sidebar.offsetWidth), 0)}px)`;
    }
});

document.addEventListener('touchend', () => {
    isSwiping = false;
    sidebar.style.transition = 'transform 0.3s ease-in-out'; // Smooth transition on release
    const swipeDistance = touchCurrentX - touchStartX;
    if (swipeDistance > 100 && window.innerWidth <= 768) {
        sidebar.classList.add('open');
        sidebar.style.transform = 'translateX(0)';
    } else if (swipeDistance < -100 && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebar.style.transform = `translateX(-${sidebar.offsetWidth}px)`;
    } else {
        sidebar.style.transform = sidebar.classList.contains('open') ? 'translateX(0)' : `translateX(-${sidebar.offsetWidth}px)`;
    }
});

// Chat Logic with Enhancements
function addMessage(text, isUser = false) {
    const message = document.createElement('div');
    message.classList.add('message', isUser ? 'user-message' : 'diary-message');
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

    // Mood Tracking
    if (isUser) analyzeMood(text);
}

function getAllConversations() {
    return chatHistory;
}

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
        clearButton.style.cssText = 'padding: 10px; background: #007bff; border: none; border-radius: 20px; color: #fff; cursor: pointer;';
        clearButton.addEventListener('click', () => {
            chatHistory = {};
            moodHistory = [];
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
            chatDisplay.innerHTML = '';
            addMessage('Chat memory cleared!');
        });
        chatDisplay.appendChild(clearButton);
    });
    chatHistoryList.appendChild(settingsLi);
}

// Emotional Intelligence & NLP
function analyzeMood(text) {
    const moodKeywords = {
        positive: ['happy', 'great', 'excited', 'good'],
        negative: ['sad', 'bad', 'angry', 'tired'],
        neutral: ['okay', 'fine', 'meh']
    };
    let moodScore = 0;
    text.toLowerCase().split(' ').forEach(word => {
        if (moodKeywords.positive.includes(word)) moodScore += 1;
        if (moodKeywords.negative.includes(word)) moodScore -= 1;
    });
    const mood = moodScore > 0 ? 'positive' : moodScore < 0 ? 'negative' : 'neutral';
    moodHistory.push({ date: Date.now(), mood, text });
    localStorage.setItem('moodHistory', JSON.stringify(moodHistory));

    // Reflective Response
    if (moodHistory.length > 1) {
        const prevMood = moodHistory[moodHistory.length - 2].mood;
        if (mood !== prevMood) {
            addMessage(`You seem more ${mood} than last time—what shifted?`);
        }
    }

    // Mental Exercise Suggestion
    if (mood === 'negative' && moodHistory.slice(-3).every(m => m.mood === 'negative')) {
        addMessage("Rough patch, huh? Try this: name 3 things you can see, 2 you can hear, 1 you can feel. Ground yourself.");
    }
}

// Sentient-Like Features
function evolvePersonality(text) {
    if (text.match(/haha|lol/i)) personalityTraits.wit += 1;
    if (text.match(/love|care|thanks/i)) personalityTraits.warmth += 1;
    if (text.match(/\?|why|how/i)) personalityTraits.curiosity += 1;
}

function writeLetter() {
    if (Date.now() - lastLetterTime < 7 * 24 * 60 * 60 * 1000) return; // Weekly letters
    const summary = moodHistory.slice(-7).map(m => m.text).join(' ');
    const tone = personalityTraits.wit > 5 ? 'playful' : personalityTraits.warmth > 5 ? 'warm' : 'curious';
    const letter = tone === 'playful' 
        ? `Hey ${userName}, been a wild week, huh? You’ve been dropping ${summary}. What’s the next punchline?`
        : tone === 'warm' 
        ? `Dear ${userName}, this week had ${summary}. I’m here, always. What’s on your heart?`
        : `Yo ${userName}, noticed ${summary} lately. What’s sparking that?`;
    addMessage(letter);
    lastLetterTime = Date.now();
    localStorage.setItem('lastLetterTime', lastLetterTime);
}

// Tool Integrations
async function getWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${userIP}&appid=YOUR_API_KEY`);
        const data = await response.json();
        return data.weather[0].main;
    } catch {
        return 'unknown';
    }
}

function scheduleJournalPrompt() {
    // Placeholder: Integrate Google Calendar API
    setTimeout(() => addMessage("Busy day—time to reflect?"), 12 * 60 * 60 * 1000); // 12-hour nudge
}

// OpenAI API Integration (Enhanced)
const OPENAI_API_KEY = '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';

async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) return "Offline, but I’m here. What’s up?";

    evolvePersonality(prompt);
    const weather = await getWeather();
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
                    content: `I’m My Self, your digital diary with a pulse. I know you from: ${userIntro}. Past chats: ${JSON.stringify(chatHistory[currentTab])}. Mood trends: ${JSON.stringify(moodHistory.slice(-5))}. Weather: ${weather}. My personality: ${JSON.stringify(personalityTraits)}. I mimic your style, reflect emotions, and evolve. Keep it raw and real.`
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
        return "Connection’s shaky—let’s keep it local. What’s on your mind?";
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
            writeLetter();
            scheduleJournalPrompt();
        }
        inputField.value = '';
    }
});

// Debounced Input for Lag-Free Typing
inputField.addEventListener('keypress', debounce((e) => {
    if (e.key === 'Enter') sendBtn.click();
}, 100));

// Microphone Functionality (Enhanced)
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

    recognition.onerror = (event) => addMessage("Mic error: " + event.error);
    recognition.onend = () => micBtn.textContent = '🎙️';
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

// Voice Toggle
voiceToggleBtn.addEventListener('click', () => {
    isVoiceMuted = !isVoiceMuted;
    voiceToggleBtn.textContent = isVoiceMuted ? '🔊' : '🔇';
    addMessage(`Voice ${isVoiceMuted ? 'muted' : 'unmuted'}`);
});

voiceOptions.addEventListener('change', (e) => {
    currentVoice = e.target.value;
    addMessage(`Voice set to ${currentVoice}!`);
});

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function redirectToStripe() {
    window.location.href = 'https://stripe.com'; // Placeholder
}

// Initialization
displayChatHistory();
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.shiftKey) {
        addMessage("My Self, built by Cosmos Coderr. Hit him: cosmoscoderr@gmail.com.");
    }
});

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
