let currentFunction = 'chat';
let chatHistory = loadChatHistory();
let functionHistory = loadFunctionHistory();
let qaHistory = loadQaHistory();
let searchHistory = loadSearchHistory();

document.getElementById('chat').addEventListener('click', () => {
  currentFunction = 'chat';
  displayHistory(chatHistory);
});

document.getElementById('function').addEventListener('click', () => {
  currentFunction = 'function';
  displayHistory(functionHistory);
});

document.getElementById('qa').addEventListener('click', () => {
  currentFunction = 'qa';
  displayHistory(qaHistory);
});

document.getElementById('search').addEventListener('click', () => {
  currentFunction = 'search';
  displayHistory(searchHistory);
});

document.getElementById('submit').addEventListener('click', async () => {
  const input = document.getElementById('input').value;

  if (!input) {
    return;
  }

  addMessageToChat('user', input);
  document.getElementById('input').value = '';
  document.getElementById('input').focus();

  try {
    const history = getCurrentHistory();
    console.log('Sending chat request:', { input, history });
    const response = await fetch(`/api/${currentFunction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, history }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    console.log('Received chat response:', data.answer || data.result || 'No response');
    addMessageToChat('assistant', data.answer || data.result || 'No response');
    updateHistory(history, input, data.answer || data.result, getStorageKey());
  } catch (error) {
    console.error('Error in chat:', error);
    addMessageToChat('assistant', 'Error: ' + error.message);
  }
});

function getCurrentHistory() {
  switch (currentFunction) {
    case 'chat':
      return chatHistory;
    case 'function':
      return functionHistory;
    case 'qa':
      return qaHistory;
    case 'search':
      return searchHistory;
    default:
      return [];
  }
}

function getStorageKey() {
  switch (currentFunction) {
    case 'chat':
      return 'chatHistory';
    case 'function':
      return 'functionHistory';
    case 'qa':
      return 'qaHistory';
    case 'search':
      return 'searchHistory';
    default:
      return '';
  }
}

function addMessageToChat(role, content) {
  const chatWindow = document.getElementById('log');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateHistory(history, userMessage, aiResponse, storageKey) {
  history.push({ role: 'user', content: userMessage });
  history.push({ role: 'assistant', content: aiResponse });
  if (history.length > 20) history.splice(0, 2); // Keep only the last 10 interactions (20 messages)
  localStorage.setItem(storageKey, JSON.stringify(history));
  displayHistory(history);
}

function loadChatHistory() {
  const history = localStorage.getItem('chatHistory');
  return history ? JSON.parse(history) : [];
}

function loadFunctionHistory() {
  const history = localStorage.getItem('functionHistory');
  return history ? JSON.parse(history) : [];
}

function loadQaHistory() {
  const history = localStorage.getItem('qaHistory');
  return history ? JSON.parse(history) : [];
}

function loadSearchHistory() {
  const history = localStorage.getItem('searchHistory');
  return history ? JSON.parse(history) : [];
}

function displayHistory(history) {
  const chatWindow = document.getElementById('log');
  chatWindow.innerHTML = ''; // Clear the chat window
  history.slice(-20).forEach(message => addMessageToChat(message.role, message.content)); // Display the last 10 interactions (20 messages)
}

// Display chat history on page load
displayHistory(chatHistory);
