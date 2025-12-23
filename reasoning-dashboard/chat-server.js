import fs from 'fs';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatDataDir = path.join(__dirname, 'chat-data');

const app = express();
const PORT = 3001;

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Ensure chat-data directory exists
if (!fs.existsSync(chatDataDir)) {
  fs.mkdirSync(chatDataDir, { recursive: true });
}

// Save chats
app.post('/api/save', (req, res) => {
  try {
    const { conversations, messages, currentConversationId } = req.body;
    console.log('\nPOST /api/save received');
    console.log(`Received save request: ${conversations.length} conversations, ${messages.length} messages, convId: ${currentConversationId}`);

    fs.writeFileSync(
      path.join(chatDataDir, 'conversations.json'),
      JSON.stringify(conversations, null, 2)
    );
    fs.writeFileSync(
      path.join(chatDataDir, 'messages.json'),
      JSON.stringify(messages, null, 2)
    );
    fs.writeFileSync(
      path.join(chatDataDir, 'currentConversationId.json'),
      JSON.stringify({ id: currentConversationId }, null, 2)
    );

    console.log(`Files saved to ${chatDataDir}`);
    res.json({ success: true, message: 'Chats saved' });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load chats
app.get('/api/load', (req, res) => {
  try {
    const convPath = path.join(chatDataDir, 'conversations.json');
    const msgsPath = path.join(chatDataDir, 'messages.json');
    const idPath = path.join(chatDataDir, 'currentConversationId.json');

    console.log('\nGET /api/load received');
    console.log(`Load request - checking ${chatDataDir}`);
    console.log(`  - conversations.json exists: ${fs.existsSync(convPath)}`);
    console.log(`  - messages.json exists: ${fs.existsSync(msgsPath)}`);
    console.log(`  - currentConversationId.json exists: ${fs.existsSync(idPath)}`);

    const conversations = fs.existsSync(convPath)
      ? JSON.parse(fs.readFileSync(convPath, 'utf8'))
      : [];
    const messages = fs.existsSync(msgsPath)
      ? JSON.parse(fs.readFileSync(msgsPath, 'utf8'))
      : [];
    const idData = fs.existsSync(idPath)
      ? JSON.parse(fs.readFileSync(idPath, 'utf8'))
      : { id: null };

    console.log(`Loaded: ${conversations.length} conversations, ${messages.length} messages`);
    res.json({ conversations, messages, currentConversationId: idData.id });
  } catch (err) {
    console.error('Load error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);

});
