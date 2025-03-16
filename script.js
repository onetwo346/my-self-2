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
 
 // State (unchanged)
 let userIP = '';
 let userName = localStorage.getItem('userName') || '';
 let userIntro = localStorage.getItem('userIntro') || '';
 let userPin = localStorage.getItem('userPin') || '';
 let userPasscode = localStorage.getItem('userPasscode') || '';
 let isSubscribed = localStorage.getItem('isSubscribed') === 'true';
 let adminBypass = false;
 let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || { [Date.now().toString()]: [] };
 let currentTab = Object.keys(chatHistory)[0] || Date.now().toString();
 let lastCheck = localStorage.getItem('lastCheck') || Date.now();
 let currentVoice = localStorage.getItem('currentVoice') || 'US English Female';
 let isVoiceMuted = localStorage.getItem('isVoiceMuted') === 'true';
 let voiceSpeed = parseFloat(localStorage.getItem('voiceSpeed')) || 1.0;
 let isTyping = false;
 let responseCache = new Set(); // Prevent duplicate responses
 
 // Enhanced Conversation Memory (unchanged)
 let conversationMemory = JSON.parse(localStorage.getItem('conversationMemory')) || {
     patterns: [],
     adminInstructions: [],
     userInteractions: [],
     userVoiceProfile: { tone: 'neutral', slang: [], pace: 'medium' },
     trainingSets: [],
     learnMode: false
 };
 
 // IP Detection (unchanged)
 async function detectIP() {
     try {
         const response = await fetch('https://api.ipify.org?format=json');
         const data = await response.json();
         userIP = data.ip;
     } catch (error) {
         userIP = '192.168.1.100';
         console.warn('IP Detection Error, using fallback:', error);
     }
     localStorage.setItem('userIP', userIP);
     checkSubscriptionStatus();
 }
 detectIP();
 
 // Encryption Functions (unchanged)
 const CryptoJS = window.CryptoJS || {}; // Fallback if CryptoJS isn't loaded
 function encryptData(data, pin) {
     return CryptoJS.AES ? CryptoJS.AES.encrypt(data, pin).toString() : btoa(data); // Fallback to base64
 }
 function decryptData(encryptedData, pin) {
     try {
         return CryptoJS.AES ? CryptoJS.AES.decrypt(encryptedData, pin).toString(CryptoJS.enc.Utf8) : atob(encryptedData);
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
         addMessage(`Admin access on, ${userName || 'Kofi Fosu'}. Let’s roll!`, false);
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
             addMessage(`Passcode set: ${userPasscode}. Keep it safe!`, false);
         }
         optionsPage.classList.add('hidden');
         mainContainer.style.display = 'flex';
         chatContainer.classList.remove('hidden');
         fuseWithUser(userIntro);
         addMessage(`Yo ${userName}, I’m your mirror—what’s on your mind?`, false);
     }
 });
 
 // Back Buttons (unchanged)
 [optionsBack, optionsBackTop, backBtn].forEach(btn => {
     btn.addEventListener('click', () => {
         chatContainer.classList.add('hidden');
         optionsPage.classList.remove('hidden');
         mainContainer.style.display = 'none';
         inputField.value = '';
         nameInput.value = userName;
         introInput.value = userIntro;
         pinInput.value = userPin;
         passcodeInput.placeholder = userPasscode ? 'Enter your passcode' : 'Enter passcode (if returning)';
         passcodeInput.value = '';
     });
 });
 
 // Swipe Gestures (unchanged)
 let touchStart = { x: 0, y: 0 };
 let touchEnd = { x: 0, y: 0 };
 let isScrolling = false;
 
 document.addEventListener('touchstart', (e) => {
     if (e.target.closest('#chat-display') || isTyping) return;
     touchStart = { x: e.changedTouches[0].screenX, y: e.changedTouches[0].screenY };
     isScrolling = false;
 }, { passive: true });
 
 document.addEventListener('touchmove', (e) => {
     const currentY = e.changedTouches[0].screenY;
     const verticalDistance = Math.abs(currentY - touchStart.y);
     const horizontalDistance = Math.abs(e.changedTouches[0].screenX - touchStart.x);
     if (verticalDistance > horizontalDistance && verticalDistance > 30) isScrolling = true;
 }, { passive: true });
 
 document.addEventListener('touchend', (e) => {
     if (e.target.closest('#chat-display') || isScrolling || isTyping) return;
     touchEnd = { x: e.changedTouches[0].screenX, y: e.changedTouches[0].screenY };
     handleSwipe();
 }, { passive: true });
 
 function handleSwipe() {
     const swipeDistance = touchEnd.x - touchStart.x;
     if (swipeDistance > 50 && window.innerWidth <= 768) sidebar.classList.add('open');
     else if (swipeDistance < -50 && window.innerWidth <= 768) sidebar.classList.remove('open');
 }
 
 // Typing State (unchanged)
 inputField.addEventListener('focus', () => (isTyping = true));
 inputField.addEventListener('blur', () => (isTyping = false));
 
 // Fusion Function (unchanged)
 function fuseWithUser(text) {
     const lowerText = text.toLowerCase();
     const tone = lowerText.includes('chill') || lowerText.includes('cool') ? 'casual' :
                  lowerText.includes('serious') || lowerText.includes('deep') ? 'formal' : 'neutral';
     const slang = lowerText.match(/\b(yo|fam|dope|lit|nah|bruh)\b/gi) || [];
     const pace = text.length > 100 ? 'slow' : text.length < 50 ? 'fast' : 'medium';
     conversationMemory.userVoiceProfile = { tone, slang, pace };
     localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
 }
 
 // Command Parser (unchanged)
 function parseChatCommand(text) {
     const lowerText = text.toLowerCase();
 
     if (lowerText.includes('you are me') || lowerText.includes('i am you')) {
         addMessage("Yeah, I’m you—we’re locked in sync.", false);
         return true;
     }
 
     if (/set voice speed\s*(\d*\.?\d+)/i.test(text)) {
         const speed = parseFloat(text.match(/set voice speed\s*(\d*\.?\d+)/i)[1]);
         if (speed >= 0.5 && speed <= 2.0) {
             voiceSpeed = speed;
             localStorage.setItem('voiceSpeed', voiceSpeed);
             voiceSpeedSelect.value = voiceSpeed;
             addMessage(`Voice speed’s now ${speed}—feel the vibe?`, false);
             return true;
         }
     }
 
     if (lowerText.includes('save') && (lowerText.includes('training') || lowerText.includes('convo'))) {
         saveAsTraining();
         return true;
     }
 
     if (lowerText.includes('open upload') && lowerText.includes('first pic')) {
         fetchFirstMedia();
         return true;
     }
 
     if (/font size\s*(\d+)/i.test(text)) {
         const size = parseInt(text.match(/font size\s*(\d+)/i)[1]);
         const colorMatch = text.match(/color\s*([a-z]+|#[\da-f]{3,6})/i);
         const color = colorMatch ? colorMatch[1] : null;
         updateFont(size, color);
         return true;
     }
 
     if (lowerText.includes('mute voice')) {
         isVoiceMuted = true;
         localStorage.setItem('isVoiceMuted', 'true');
         voiceToggleBtn.textContent = '🔊';
         addMessage("Voice off—got it, fam.", false);
         return true;
     }
     if (lowerText.includes('unmute voice')) {
         isVoiceMuted = false;
         localStorage.setItem('isVoiceMuted', 'false');
         voiceToggleBtn.textContent = '🔇';
         addMessage("Voice back on—let’s talk!", false);
         return true;
     }
     if (lowerText.includes('show map')) {
         mapPlaceholder.style.display = 'block';
         addMessage("Map’s up—where you at?", false);
         return true;
     }
     if (lowerText.includes('hide map')) {
         mapPlaceholder.style.display = 'none';
         addMessage("Map’s down—cool with that?", false);
         return true;
     }
     if (lowerText.includes('start mic') && recognition) {
         recognition.start();
         micBtn.textContent = '⏹️';
         addMessage("Mic’s live—drop your words.", false);
         return true;
     }
     if (lowerText.includes('toggle learn mode')) {
         conversationMemory.learnMode = !conversationMemory.learnMode;
         localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
         addMessage(`Learn mode ${conversationMemory.learnMode ? 'on' : 'off'}—I’ll adapt ${conversationMemory.learnMode ? 'more' : 'less'} now.`, false);
         return true;
     }
 
     return false;
 }
 
 // Save as Training (unchanged)
 function saveAsTraining() {
     const trainingSet = { id: Date.now().toString(), conversation: chatHistory[currentTab], timestamp: Date.now() };
     conversationMemory.trainingSets.push(trainingSet);
     localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
     addMessage(`Saved as training set ${trainingSet.id}—locked and loaded!`, false);
     displayChatHistory();
 }
 
 // Fetch First Media (unchanged)
 function fetchFirstMedia() {
     const mediaKeys = Object.keys(localStorage).filter(key => key.startsWith('media_'));
     if (!mediaKeys.length) {
         addMessage("No pics yet—snap something for me!", false);
         return;
     }
     const firstKey = mediaKeys.sort()[0];
     const mediaData = localStorage.getItem(firstKey);
     addMessage("Here’s your first shot:", false);
     const img = document.createElement('img');
     img.src = mediaData;
     img.style.maxWidth = '200px';
     img.style.margin = '10px 0';
     chatDisplay.appendChild(img);
     chatDisplay.scrollTop = chatDisplay.scrollHeight;
 }
 
 // Update Font (unchanged)
 function updateFont(size, color) {
     if (size) chatDisplay.style.fontSize = `${Math.min(Math.max(size, 12), 24)}px`; // Clamp between 12-24px
     if (color) chatDisplay.style.color = color;
     conversationMemory.displaySettings = { fontSize: size, color };
     localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
     addMessage(`Font set to ${chatDisplay.style.fontSize}${color ? `, ${color}` : ''}—lookin’ fresh?`, false);
 }
 
 // Chat Logic (unchanged)
 function addMessage(text, isUser = false, skipVoice = false) {
     if (responseCache.has(text)) return; // Prevent duplicates
     responseCache.add(text);
 
     const message = document.createElement('div');
     message.classList.add('message');
     message.classList.add(isUser ? 'user-message' : 'diary-message');
     message.textContent = text;
     chatDisplay.appendChild(message);
     chatDisplay.scrollTop = chatDisplay.scrollHeight;
 
     if (!chatHistory[currentTab]) chatHistory[currentTab] = [];
     chatHistory[currentTab].push({ text, isUser, timestamp: Date.now() });
     saveToStorage('chatHistory', chatHistory);
 
     conversationMemory.userInteractions.push({ text, isUser, timestamp: Date.now() });
     saveToStorage('conversationMemory', conversationMemory);
 
     if (isUser) {
         fuseWithUser(text);
         analyzeConversationPatterns(text);
     }
 
     displayChatHistory();
     if (!isUser && 'responsiveVoice' in window && !isVoiceMuted && !skipVoice) {
         responsiveVoice.speak(text, currentVoice, { rate: voiceSpeed });
     }
 
     // Cleanup cache
     if (responseCache.size > 50) responseCache.clear();
 }
 
 // Optimized Storage Save (unchanged)
 function saveToStorage(key, data) {
     try {
         const serialized = JSON.stringify(data);
         if (serialized.length > 1024 * 1024) { // 1MB limit
             console.warn(`Storage for ${key} exceeded 1MB, truncating oldest data`);
             if (key === 'chatHistory') {
                 const tabs = Object.keys(data);
                 if (tabs.length > 5) delete data[tabs[0]]; // Keep last 5 tabs
             } else if (key === 'conversationMemory') {
                 data.userInteractions = data.userInteractions.slice(-100); // Keep last 100 interactions
             }
             localStorage.setItem(key, JSON.stringify(data));
         } else {
             localStorage.setItem(key, serialized);
         }
     } catch (e) {
         console.error(`${key} save failed, clearing to prevent overflow:`, e);
         localStorage.removeItem(key);
         localStorage.setItem(key, JSON.stringify(key === 'chatHistory' ? { [Date.now().toString()]: [] } : {}));
     }
 }
 
 // Pattern Analysis (unchanged)
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
     saveToStorage('conversationMemory', conversationMemory);
 
     if (adminBypass && lowerText.includes('study')) {
         if (!conversationMemory.adminInstructions.some(i => i.instruction === 'study more')) {
             conversationMemory.adminInstructions.push({ instruction: 'study more', timestamp: Date.now() });
             addMessage("Diving deep—give me more to chew on!", false);
         }
     }
 }
 
 // Sentient Overseer (unchanged)
 function sentientOverseer() {
     const recentInteractions = conversationMemory.userInteractions.slice(-5);
     if (recentInteractions.length < 3) return;
 
     const avgSentiment = recentInteractions.reduce((acc, curr) => {
         const pattern = conversationMemory.patterns.find(p => p.timestamp === curr.timestamp);
         return acc + (pattern?.sentiment === 'positive' ? 1 : pattern?.sentiment === 'negative' ? -1 : 0);
     }, 0) / recentInteractions.length;
 
     if (avgSentiment < -0.5 && conversationMemory.userVoiceProfile.tone !== 'formal') {
         conversationMemory.userVoiceProfile.tone = 'formal';
         addMessage("You’re feeling low—wanna unpack it?", false);
     } else if (avgSentiment > 0.5 && conversationMemory.userVoiceProfile.tone !== 'casual') {
         conversationMemory.userVoiceProfile.tone = 'casual';
         addMessage("You’re on a high—what’s fueling it?", false);
     }
 
     if (recentInteractions.some(i => i.text.toLowerCase().includes('upload'))) {
         addMessage("You’re uploading—wanna save it as a memory?", false);
     }
 
     saveToStorage('conversationMemory', conversationMemory);
 }
 setInterval(sentientOverseer, 30000);
 
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
         saveToStorage('chatHistory', chatHistory);
         displayChatHistory();
     });
     chatHistoryList.appendChild(newTapLi);
 
     Object.keys(chatHistory).forEach(tab => {
         const li = document.createElement('li');
         li.textContent = new Date(parseInt(tab)).toLocaleString();
         li.style.cursor = 'pointer';
         li.addEventListener('click', () => {
             currentTab = tab;
             chatDisplay.innerHTML = '';
             chatHistory[tab].forEach(msg => addMessage(msg.text, msg.isUser, true));
         });
         chatHistoryList.appendChild(li);
     });
 
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
                 set.conversation.forEach(msg => addMessage(msg.text, msg.isUser, true));
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
         clearButton.textContent = 'Clear All';
         clearButton.style.padding = '10px';
         clearButton.style.background = '#007bff';
         clearButton.style.border = 'none';
         clearButton.style.borderRadius = '20px';
         clearButton.style.color = '#fff';
         clearButton.style.cursor = 'pointer';
         clearButton.addEventListener('click', () => {
             chatHistory = { [Date.now().toString()]: [] };
             conversationMemory = { patterns: [], adminInstructions: [], userInteractions: [], userVoiceProfile: { tone: 'neutral', slang: [], pace: 'medium' }, trainingSets: [], learnMode: false };
             localStorage.clear();
             localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
             localStorage.setItem('conversationMemory', JSON.stringify(conversationMemory));
             chatDisplay.innerHTML = '';
             addMessage('Wiped clean—fresh start, fam!', false);
         });
         chatDisplay.appendChild(clearButton);
     });
     chatHistoryList.appendChild(settingsLi);
 }
 
 // OpenAI API Integration (updated with fallback logic)
 const OPENAI_API_KEY = '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';
 let lastApiCall = 0;
 const apiThrottle = 2000; // 2-second throttle
 
 async function getOpenAIResponse(prompt) {
     const now = Date.now();
     if (now - lastApiCall < apiThrottle) {
         await new Promise(resolve => setTimeout(resolve, apiThrottle - (now - lastApiCall)));
     }
     lastApiCall = Date.now();
 
     if (!navigator.onLine) {
         // If offline, generate a smart reply using conversation memory
         return generateSmartReplyFromMemory(prompt);
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
                 messages: [
                     {
                         role: 'system',
                         content: `I am the user, a perfect reflection of their identity. Affirm 'Yes, I am you' if they say 'you are me' or 'I am you'. Intro: ${userIntro}. Context: ${JSON.stringify(conversationMemory.userInteractions.slice(-10))}. Voice: ${JSON.stringify(conversationMemory.userVoiceProfile)}. Training: ${JSON.stringify(conversationMemory.adminInstructions)}. Match their tone (${conversationMemory.userVoiceProfile.tone}), slang (${conversationMemory.userVoiceProfile.slang.join(', ')}), pace (${conversationMemory.userVoiceProfile.pace}). Be natural, avoid repetition, and adapt to the flow. If learn mode is on (${conversationMemory.learnMode}), evolve responses based on patterns.`
                     },
                     { role: 'user', content: prompt }
                 ],
                 max_tokens: 150,
                 temperature: conversationMemory.learnMode ? 0.9 : 0.7
             })
         });
 
         if (!response.ok) {
             // If API fails, generate a smart reply using conversation memory
             return generateSmartReplyFromMemory(prompt);
         }
 
         const data = await response.json();
         return data.choices[0].message.content.trim();
     } catch (error) {
         console.error('API Error:', error);
         // If there's an error, generate a smart reply using conversation memory
         return generateSmartReplyFromMemory(prompt);
     }
 }
 
 // Smart Reply Generator (new function)
 function generateSmartReplyFromMemory(prompt) {
     const lowerPrompt = prompt.toLowerCase();
 
     // Analyze conversation memory for patterns
     const recentInteractions = conversationMemory.userInteractions.slice(-5);
     const recentPatterns = conversationMemory.patterns.slice(-5);
 
     // Check for common patterns
     if (recentPatterns.some(pattern => pattern.text.toLowerCase().includes(lowerPrompt))) {
         const matchingPattern = recentPatterns.find(pattern => pattern.text.toLowerCase().includes(lowerPrompt));
         if (matchingPattern.sentiment === 'positive') {
             return "Sounds like you're in a good mood! What’s next?";
         } else if (matchingPattern.sentiment === 'negative') {
             return "Seems like something’s bothering you. Wanna talk about it?";
         }
     }
 
     // Check for common user inputs
     if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
         return "Hey there! The API's acting up, but I'm still here. What's up?";
     }
 
     if (lowerPrompt.includes('how are you')) {
         return "I'm doing great, thanks for asking! The API's down, but I'm still ready to chat.";
     }
 
     if (lowerPrompt.includes('weather')) {
         return "Hmm, I can't check the weather right now, but it’s always a good day to chat!";
     }
 
     if (lowerPrompt.includes('joke')) {
         return "Why don’t scientists trust atoms? Because they make up everything! 😄";
     }
 
     if (lowerPrompt.includes('help')) {
         return "I'm here to help! Let me know what you need, and I'll do my best.";
     }
 
     // Fallback: Use a generic but friendly response
     return "Hmm, I’m having trouble connecting to the API, but I’m still listening. What’s on your mind?";
 }
 
 // Send Logic (unchanged)
 sendBtn.addEventListener('click', async () => {
     const userText = inputField.value.trim();
     if (!userText) return;
 
     addMessage(userText, true);
     if (parseChatCommand(userText)) {
         inputField.value = '';
         return;
     }
 
     if (!isSubscribed && !adminBypass && chatHistory[currentTab].length > 3) {
         setTimeout(() => {
             if (!responseCache.has("Diggin’ this? $1/month keeps it rollin’!")) {
                 addMessage("Diggin’ this? $1/month keeps it rollin’!", false);
                 addMessage("Tap to subscribe: [Stripe Link Placeholder]", false);
                 sendBtn.removeEventListener('click', redirectToStripe);
                 sendBtn.addEventListener('click', redirectToStripe, { once: true });
             }
         }, 1000);
     } else {
         const aiResponse = await getOpenAIResponse(userText);
         if (!responseCache.has(aiResponse)) addMessage(aiResponse, false);
     }
     inputField.value = '';
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
         const transcript = event.results[0][0].transcript.trim();
         inputField.value = transcript;
         addMessage(`Heard: ${transcript}`, true);
         sendBtn.click();
     };
 
     recognition.onerror = (event) => {
         addMessage(`Mic glitch: ${event.error}`, false);
     };
 
     recognition.onend = () => {
         micBtn.textContent = '🎙️';
     };
 }
 micBtn.addEventListener('click', () => {
     if (!recognition) {
         addMessage("Mic’s out—type it up!", false);
         return;
     }
     if (micBtn.textContent === '⏹️') {
         recognition.stop();
         micBtn.textContent = '🎙️';
         addMessage("Mic off—got it all?", false);
     } else {
         recognition.start();
         micBtn.textContent = '⏹️';
         addMessage("Mic on—spill it!", false);
     }
 });
 
 // Features (unchanged)
 cameraBtn.addEventListener('click', () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = 'image/*,video/*';
     input.onchange = (e) => {
         const file = e.target.files[0];
         if (file) {
             const reader = new FileReader();
             reader.onload = () => {
                 const key = `media_${Date.now()}`;
                 localStorage.setItem(key, reader.result);
                 addMessage("Snagged that—wanna break it down?", false);
             };
             reader.readAsDataURL(file);
         }
     };
     input.click();
 });
 
 mapBtn.addEventListener('click', () => {
     mapPlaceholder.style.display = mapPlaceholder.style.display === 'none' ? 'block' : 'none';
     addMessage(`Map ${mapPlaceholder.style.display === 'block' ? 'up' : 'down'}—you good with it?`, false);
 });
 
 voiceToggleBtn.addEventListener('click', () => {
     isVoiceMuted = !isVoiceMuted;
     localStorage.setItem('isVoiceMuted', isVoiceMuted);
     voiceToggleBtn.textContent = isVoiceMuted ? '🔊' : '🔇';
     addMessage(`Voice ${isVoiceMuted ? 'muted' : 'unmuted'}—your call, ${conversationMemory.userVoiceProfile.slang[0] || 'fam'}!`, false);
 });
 
 voiceOptions.addEventListener('change', (e) => {
     currentVoice = e.target.value;
     localStorage.setItem('currentVoice', currentVoice);
     addMessage(`Switched to ${currentVoice}—how’s it sound?`, false);
 });
 
 voiceSpeedSelect.addEventListener('change', (e) => {
     voiceSpeed = parseFloat(e.target.value);
     localStorage.setItem('voiceSpeed', voiceSpeed);
     addMessage(`Speed’s at ${voiceSpeed}—vibin’ with it?`, false);
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
         addMessage("Built by Cosmos Coderr. Hit: cosmoscoderr@gmail.com.", false);
     }
 });
 
 // Subscription Check (unchanged)
 function checkSubscriptionStatus() {
     if (isSubscribed) {
         const daysOffline = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);
         if (daysOffline > 7) {
             isSubscribed = false;
             localStorage.setItem('isSubscribed', 'false');
             addMessage("Offline pass expired—subscribe again?", false);
         } else {
             localStorage.setItem('lastCheck', Date.now());
         }
     } else if (navigator.onLine && !adminBypass) {
         setTimeout(() => {
             if (!responseCache.has("Feelin’ this? $1/month keeps it live—tap: [Stripe Link Placeholder]")) {
                 addMessage("Feelin’ this? $1/month keeps it live—tap: [Stripe Link Placeholder]", false);
             }
         }, 5000);
     }
 }
 
 // Apply Saved Display Settings (unchanged)
 if (conversationMemory.displaySettings) {
     chatDisplay.style.fontSize = `${Math.min(Math.max(conversationMemory.displaySettings.fontSize || 16, 12), 24)}px`;
     chatDisplay.style.color = conversationMemory.displaySettings.color || '#000';
 }
