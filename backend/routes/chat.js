const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../mockDb');

const JWT_SECRET = process.env.JWT_SECRET || 'metrobuddy_secret_dev';

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// @route   GET /api/chat/:matchId/messages
// @desc    Get all messages for a specific match
// @access  Private
router.get('/:matchId/messages', auth, async (req, res) => {
  const { matchId } = req.params;

  try {
    // Verify user belongs to this match
    const match = db.matches.find(m => m.id === matchId && m.status === 'active');
    if (!match) {
      return res.status(404).json({ error: 'Active match not found' });
    }

    if (match.user1.id !== req.user.id && match.user2.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You are not part of this match.' });
    }

    // Filter messages for this match
    const messages = db.messages.filter(m => m.matchId === matchId);
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chat/:matchId/messages
// @desc    Send a message (text, voice, or media)
// @access  Private
router.post('/:matchId/messages', auth, async (req, res) => {
  const { matchId } = req.params;
  const { type, content, mediaUrl, viewOnce, duration } = req.body;

  if (!type || (!content && !mediaUrl && !duration)) {
    return res.status(400).json({ error: 'Message type and contents are required' });
  }

  try {
    // Verify user belongs to this match
    const match = db.matches.find(m => m.id === matchId && m.status === 'active');
    if (!match) {
      return res.status(404).json({ error: 'Active match not found' });
    }

    if (match.user1.id !== req.user.id && match.user2.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const newMessage = {
      id: String(Date.now()),
      matchId,
      senderId: req.user.id,
      type, // 'text' | 'media' | 'voice'
      content: content || null,
      mediaUrl: mediaUrl || null,
      viewOnce: viewOnce || false,
      isOpened: false, // view once flag
      duration: duration || null, // voice note duration
      createdAt: new Date().toISOString()
    };

    db.messages.push(newMessage);
    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chat/message/:messageId/reveal
// @desc    Reveal view-once media message (instantly deletes URL)
// @access  Private
router.post('/message/:messageId/reveal', auth, async (req, res) => {
  const { messageId } = req.params;

  try {
    const messageIndex = db.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = db.messages[messageIndex];

    // Verify user is in the match associated with this message
    const match = db.matches.find(m => m.id === message.matchId && m.status === 'active');
    if (!match || (match.user1.id !== req.user.id && match.user2.id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!message.viewOnce) {
      return res.status(400).json({ error: 'Not a view-once media message' });
    }

    if (message.isOpened) {
      return res.status(400).json({ error: 'Media already opened' });
    }

    // Mark as opened and immediately scrub the mediaUrl to prevent access
    message.isOpened = true;
    message.mediaUrl = null;
    message.content = 'Opened';

    res.json({ message: 'View-once media marked as opened and deleted', updatedMessage: message });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chat/:matchId/simulate-reply
// @desc    Simulate a companion replying to the chat
// @access  Private
router.post('/:matchId/simulate-reply', auth, async (req, res) => {
  const { matchId } = req.params;
  const { type, content, mediaUrl, viewOnce, duration } = req.body || {};

  try {
    const match = db.matches.find(m => m.id === matchId && m.status === 'active');
    if (!match) {
      return res.status(404).json({ error: 'Active match not found' });
    }

    // Buddy ID is the other user
    const buddyId = match.user1.id === req.user.id ? match.user2.id : match.user1.id;

    const newMessage = {
      id: String(Date.now()),
      matchId,
      senderId: buddyId,
      type: type || 'text',
      content: content || 'Hello from your Metro Buddy! 👋 Where in the station are you?',
      mediaUrl: mediaUrl || null,
      viewOnce: viewOnce || false,
      isOpened: false,
      duration: duration || null,
      createdAt: new Date().toISOString()
    };

    db.messages.push(newMessage);
    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
