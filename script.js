// Firebase Config (Placeholder - Replace with your Firebase config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Core Elements
const introScreen = document.getElementById('intro-screen');
const introText = document.getElementById('intro-text');
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
const mapMemory = document.getElementById('map-memory');
const chatHistoryList = document.getElementById('chat-history-list');
const voiceToggleBtn = document.getElementById('voice-toggle-btn');
const voiceOptions = document.getElementById('voice-options');
const mainContainer = document.getElementById('main-container');
const paymentModal = document.getElementById('payment-modal');
const subscribeBtn = document.getElementById('subscribe-btn');
const closeModal = document.getElementById('close-modal');

// State
let userIP = '';
let userName = '';
let userIntro = '';
let userPin = '';
let userPasscode = '';
let isSubscribed = false;
let subscriptionEnd = null;
let adminBypass = false;
let chatHistory = {};
let currentTab = 'new';
let lastCheck = Date.now();
let currentVoice = 'UK English Male';
let isVoiceMuted = false;
let locations = {};
let cloudSyncEnabled = false;

// SQLite Setup
let dbPromise;
async function initSQLite() {
    const SQL = await initSqlJs({ locateFile: () => 'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.wasm' });
    dbPromise = new SQL.Database();
    dbPromise.run(`
        CREATE TABLE IF NOT EXISTS user_data (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS chat_history (
            tab TEXT,
            message TEXT,
            isUser BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS locations (
            tab TEXT,
            lat REAL,
            lng REAL,
            memory TEXT
        );
    `);
    loadFromSQLite();
}
initSQLite();

async function saveToSQLite(key, value) {
    const db = dbPromise;
    db.run('INSERT OR REPLACE INTO user_data (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
}

async function loadFromSQLite() {
    const db = dbPromise;
    const userData = db.exec('SELECT key, value FROM user_data');
    if (userData.length) {
        userData[0].values.forEach(([key, value]) => {
            if (key === 'userName') userName = JSON.parse(value);
            if (key === 'userIntro') userIntro = JSON.parse(value);
            if (key === 'userPin') userPin = JSON.parse(value);
            if (key === 'userPasscode') userPasscode = JSON.parse(value);
            if (key === 'isSubscribed') isSubscribed = JSON.parse(value);
            if (key === 'subscriptionEnd') subscriptionEnd = JSON.parse(value);
            if (key === 'lastCheck') lastCheck = JSON.parse(value);
            if (key === 'cloudSyncEnabled') cloudSyncEnabled = JSON.parse(value);
        });
    }
    const chatData = db.exec('SELECT tab, message, isUser FROM chat_history');
    if (chatData.length) {
        chatData[0].values.forEach(([tab, message, isUser]) => {
            if (!chatHistory[tab]) chatHistory[tab] = [];
            chatHistory[tab].push({ text: message, isUser: isUser === 1 });
        });
    }
    const locationData = db.exec('SELECT tab, lat, lng, memory FROM locations');
    if (locationData.length) {
        locationData[0].values.forEach(([tab, lat, lng, memory]) => {
            if (!locations[tab]) locations[tab] = [];
            locations[tab].push({ lat, lng, memory });
        });
    }
}

// Cloud Sync
function syncToCloud() {
    if (!cloudSyncEnabled || !navigator.onLine) return;
    const encryptedData = encryptData(JSON.stringify({ chatHistory, locations }), userPin + userIP);
    db.ref(`users/${userIP}`).set({ data: encryptedData });
}

function loadFromCloud() {
    if (!cloudSyncEnabled || !navigator.onLine) return;
    db.ref(`users/${userIP}`).once('value', snapshot => {
        const data = snapshot.val();
        if (data && data.data) {
            const decrypted = decryptData(data.data, userPin + userIP);
            const parsed = JSON.parse(decrypted);
            chatHistory = parsed.chatHistory;
            locations = parsed.locations;
            saveToSQLite('chatHistory', chatHistory);
            saveToSQLite('locations', locations);
            displayChatHistory();
        }
    });
}

// IP Detection
async function detectIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
    } catch (error) {
        userIP = '192.168.1.100';
    }
    saveToSQLite('userIP', userIP);
    checkSubscriptionStatus();
    loadFromCloud();
}

detectIP();

// Encryption Functions
function encryptData(data, key) {
    return CryptoJS.AES.encrypt(data, key).toString();
}

function decryptData(encryptedData, key) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Initial Load
introScreen.classList.remove('hidden');
optionsPage.classList.add('hidden');
chatContainer.classList.add('hidden');
mainContainer.style.display = 'none';
introText.textContent = userName ? `Welcome Back, ${userName}` : "My Self - I AM the Digital Diary And a Reflection of Your Self";

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
    } else if (userIP === localStorage.getItem('userIP')) {
        // Auto-sync if IP matches
        optionsPage.classList.add('hidden');
        mainContainer.style.display = 'flex';
        chatContainer.classList.remove('hidden');
        addMessage(`Yo ${userName}, I’m My Self—your digital echo. What’s dropping?`);
    } else {
        saveToSQLite('userName', userName);
        saveToSQLite('userIntro', userIntro);
        saveToSQLite('userPin', userPin);
        if (!userPasscode && isSubscribed) {
            userPasscode = `X${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
            saveToSQLite('userPasscode', userPasscode);
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

// Swipe Gestures
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
    dbPromise.run('INSERT INTO chat_history (tab, message, isUser) VALUES (?, ?, ?)', [currentTab, text, isUser ? 1 : 0]);
    syncToCloud();
    displayChatHistory();

    if (!isUser && 'responsiveVoice' in window && !isVoiceMuted) {
        responsiveVoice.speak(text, currentVoice, { rate: 1.0 });
    }
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
        dbPromise.run('DELETE FROM chat_history WHERE tab = ?', [currentTab]);
        syncToCloud();
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
        const settingsDiv = document.createElement('div');
        settingsDiv.innerHTML = `
            <button id="clear-memory-btn">Clear Chat Memory</button>
            <label style="margin: 10px 0; display: block;">
                Cloud Sync: 
                <input type="checkbox" id="cloud-sync-toggle" ${cloudSyncEnabled ? 'checked' : ''}>
            </label>
            <p>Subscription: ${isSubscribed ? `Active until ${new Date(subscriptionEnd).toLocaleDateString()}` : 'Unsubscribed'}</p>
            <p>Passcode: ${userPasscode || 'Not set'}</p>
        `;
        chatDisplay.appendChild(settingsDiv);
        document.getElementById('clear-memory-btn').addEventListener('click', () => {
            chatHistory = {};
            dbPromise.run('DELETE FROM chat_history');
            syncToCloud();
            chatDisplay.innerHTML = '';
            addMessage('Chat memory cleared!');
        });
        document.getElementById('cloud-sync-toggle').addEventListener('change', (e) => {
            cloudSyncEnabled = e.target.checked;
            saveToSQLite('cloudSyncEnabled', cloudSyncEnabled);
            if (cloudSyncEnabled) {
                syncToCloud();
                addMessage('Cloud sync enabled!');
            } else {
                addMessage('Cloud sync disabled.');
            }
        });
    });
    chatHistoryList.appendChild(settingsLi);
}

// GPS and Navigation
function updateMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            if (!locations[currentTab]) locations[currentTab] = [];
            const memory = chatHistory[currentTab]?.length ? `You wrote: "${chatHistory[currentTab][chatHistory[currentTab].length - 1].text}" here!` : 'No memory yet.';
            locations[currentTab].push({ lat: latitude, lng: longitude, memory });
            dbPromise.run('INSERT INTO locations (tab, lat, lng, memory) VALUES (?, ?, ?, ?)', [currentTab, latitude, longitude, memory]);
            syncToCloud();
            mapMemory.textContent = memory;
        }, () => {
            mapMemory.textContent = 'Location access denied.';
        });
    } else {
        mapMemory.textContent = 'GPS not supported.';
    }
}

mapBtn.addEventListener('click', () => {
    mapPlaceholder.style.display = mapPlaceholder.style.display === 'none' ? 'block' : 'none';
    if (mapPlaceholder.style.display === 'block') updateMap();
});

// OpenAI API Integration with Explicit Skills
const OPENAI_API_KEY = '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';

async function getOpenAIResponse(prompt) {
    if (!navigator.onLine) {
        return "Offline, but I got you. What’s hitting you today?";
    }

    let skillPrompt = '';
    if (prompt.toLowerCase().includes('use foresight')) skillPrompt = 'Use foresight to suggest a strategic plan: ';
    else if (prompt.toLowerCase().includes('use creativity')) skillPrompt = 'Use creativity to generate a unique idea: ';
    else if (prompt.toLowerCase().includes('solve math') || prompt.match(/\d+\s*[+\-*/]\s*\d+/)) skillPrompt = 'Solve this math problem: ';
    else if (prompt.toLowerCase().includes('critique')) skillPrompt = 'Use critical thinking to evaluate: ';
    else skillPrompt = 'Respond with emotional intelligence: ';

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
                    content: `I’m My Self, your digital diary with a pulse. I know you from: ${userIntro}. Past chats: ${JSON.stringify(chatHistory[currentTab])}. I bring self-awareness, emotional intelligence, foresight, metacognition, communication, research, adaptability, decision-making, systems thinking, creativity, critical thinking, designing, and homework-solving. Keep it raw, real, and sharp—reflect what they throw at me. ${skillPrompt}`
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
        if (userText.toLowerCase().includes('who made you')) {
            addMessage("I’m My Self, crafted by Cosmos Coderr. Reach him at cosmoscoderr@gmail.com.");
        } else if (!isSubscribed && !adminBypass && chatHistory[currentTab]?.length > 3) {
            paymentModal.classList.remove('hidden');
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

// Payment Modal
subscribeBtn.addEventListener('click', () => {
    // Placeholder for Stripe redirect
    isSubscribed = true;
    subscriptionEnd = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    saveToSQLite('isSubscribed', isSubscribed);
    saveToSQLite('subscriptionEnd', subscriptionEnd);
    paymentModal.classList.add('hidden');
    addMessage("Subscribed! You’re all set for a month.");
});

closeModal.addEventListener('click', () => {
    paymentModal.classList.add('hidden');
    addMessage("No worries—subscribe anytime!");
});

// Microphone Functionality (with Offline Fallback Placeholder)
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
        // Offline STT placeholder (DeepSpeech not implemented)
        addMessage("Offline STT not available—type it out!");
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

// Camera Functionality
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

// Voice Options
voiceOptions.addEventListener('change', (e) => {
    currentVoice = e.target.value;
    addMessage(`Voice set to ${currentVoice}!`);
});

// Subscription and Offline Grace
function checkSubscriptionStatus() {
    if (isSubscribed) {
        const daysOffline = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);
        if (daysOffline > 7) {
            isSubscribed = false;
            saveToSQLite('isSubscribed', false);
            addMessage("7-day offline pass expired—subscribe again?");
        } else if (Date.now() > subscriptionEnd) {
            isSubscribed = false;
            saveToSQLite('isSubscribed', false);
            addMessage("Subscription expired—renew for $1/month?");
        } else {
            lastCheck = Date.now();
            saveToSQLite('lastCheck', lastCheck);
        }
    }
}

// Creator Credit (via keypress remains as bonus)
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.shiftKey) {
        addMessage("My Self, built by Cosmos Coderr. Hit him: cosmoscoderr@gmail.com.");
    }
});
