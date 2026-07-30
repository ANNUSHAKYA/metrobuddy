const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../mockDb');

const JWT_SECRET = process.env.JWT_SECRET || 'metrobuddy_secret_dev';

const MEETUP_SPOTS = [
  'Near the main ticket barriers',
  'By the customer information booth',
  'Next to the platform 1 entry escalators',
  'At the station master office entrance',
  'Under the large central departure board'
];

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

// Helper: Check if two time windows overlap
const doTimeWindowsOverlap = (w1, w2) => {
  const start1 = new Date(w1.start).getTime();
  const end1 = new Date(w1.end).getTime();
  const start2 = new Date(w2.start).getTime();
  const end2 = new Date(w2.end).getTime();

  return start1 < end2 && start2 < end1;
};

// Helper: Find a match for a journey
const findMatchForJourney = (newJourney) => {
  return db.journeys.find(j => 
    j.id !== newJourney.id &&
    j.userId !== newJourney.userId &&
    j.status === 'active' &&
    j.departureStation === newJourney.departureStation &&
    j.destinationStation === newJourney.destinationStation &&
    doTimeWindowsOverlap(j.departureTimeWindow, newJourney.departureTimeWindow)
  );
};

// Helper: Execute a match between two journeys
const executeMatch = (j1, j2) => {
  j1.status = 'matched';
  j2.status = 'matched';

  const user1 = db.users.find(u => u.id === j1.userId) || { id: j1.userId, anonymousHandle: 'Buddy_A' };
  const user2 = db.users.find(u => u.id === j2.userId) || { id: j2.userId, anonymousHandle: 'Buddy_B' };

  const newMatch = {
    id: String(Date.now()),
    user1: { id: user1.id, handle: user1.anonymousHandle },
    user2: { id: user2.id, handle: user2.anonymousHandle },
    journey1Id: j1.id,
    journey2Id: j2.id,
    departureStation: j1.departureStation,
    destinationStation: j1.destinationStation,
    meetupSpot: MEETUP_SPOTS[Math.floor(Math.random() * MEETUP_SPOTS.length)],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.matches.push(newMatch);
  return newMatch;
};

// @route   POST /api/journeys
// @desc    Create a new journey (and trigger match check)
// @access  Private
router.post('/', auth, async (req, res) => {
  const { departureStation, destinationStation, departureTimeWindow, date } = req.body;

  if (!departureStation || !destinationStation || !departureTimeWindow || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already has an active journey, if so, deactivate it first
    db.journeys.forEach(j => {
      if (j.userId === req.user.id && j.status === 'active') {
        j.status = 'cancelled';
      }
    });

    const newJourney = {
      id: String(Date.now()),
      userId: req.user.id,
      departureStation,
      destinationStation,
      departureTimeWindow,
      date,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    db.journeys.push(newJourney);

    // Try to find a match
    const matchedJourney = findMatchForJourney(newJourney);
    let match = null;

    if (matchedJourney) {
      match = executeMatch(newJourney, matchedJourney);
      console.log(`[MATCH ENGINE] Matched Journey ${newJourney.id} with ${matchedJourney.id}`);
    }

    res.json({ journey: newJourney, match });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/journeys/active-match
// @desc    Get the current active match for the logged-in user
// @access  Private
router.get('/active-match', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const match = db.matches.find(m => 
      m.status === 'active' && 
      (m.user1.id === userId || m.user2.id === userId)
    );

    if (!match) {
      return res.json({ match: null });
    }

    // Determine buddy's details
    const isUser1 = match.user1.id === userId;
    const buddyHandle = isUser1 ? match.user2.handle : match.user1.handle;

    res.json({
      match: {
        id: match.id,
        departureStation: match.departureStation,
        destinationStation: match.destinationStation,
        meetupSpot: match.meetupSpot,
        buddyHandle,
        status: match.status
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/journeys/cancel
// @desc    Cancel journey / search / active match
// @access  Private
router.post('/cancel', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's active/matched journeys
    const activeJourneys = db.journeys.filter(j => 
      j.userId === userId && 
      (j.status === 'active' || j.status === 'matched')
    );

    activeJourneys.forEach(j => {
      j.status = 'cancelled';
    });

    // Check if they were in an active match
    const matchIndex = db.matches.findIndex(m => 
      m.status === 'active' && 
      (m.user1.id === userId || m.user2.id === userId)
    );

    if (matchIndex !== -1) {
      const match = db.matches[matchIndex];
      match.status = 'cancelled';

      // SAFETY: Purge all chat messages for this match (hard expiry)
      const matchId = match.id;
      for (let i = db.messages.length - 1; i >= 0; i--) {
        if (db.messages[i].matchId === matchId) {
          db.messages.splice(i, 1);
        }
      }
      console.log(`[SAFETY] Purged all chat messages for match ${matchId}`);

      // Re-activate the OTHER user's journey so they go back into the matching pool!
      const otherUserId = match.user1.id === userId ? match.user2.id : match.user1.id;
      const otherJourneyId = match.user1.id === userId ? match.journey2Id : match.journey1Id;

      const otherJourney = db.journeys.find(j => j.id === otherJourneyId);
      if (otherJourney) {
        otherJourney.status = 'active';
        console.log(`[MATCH ENGINE] Match dissolved. Journey ${otherJourney.id} returned to 'active' search.`);
      }
    }

    res.json({ message: 'Journey cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/journeys/simulate-match
// @desc    Simulate another user matching with this user's active journey
// @access  Private
router.post('/simulate-match', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find this user's active journey
    const userJourney = db.journeys.find(j => j.userId === userId && j.status === 'active');
    if (!userJourney) {
      return res.status(400).json({ error: 'You do not have an active journey search to match' });
    }

    // Create a mock user if CommuteBuddy_99 doesn't exist
    let buddy = db.users.find(u => u.id === 'buddy_99');
    if (!buddy) {
      buddy = {
        id: 'buddy_99',
        phone: '+1999999999',
        anonymousHandle: 'CommuteBuddy_99',
        verificationTier: 2,
        trustScore: 98
      };
      db.users.push(buddy);
    }

    // Create a matching journey for the buddy
    const buddyJourney = {
      id: String(Date.now() + 1),
      userId: buddy.id,
      departureStation: userJourney.departureStation,
      destinationStation: userJourney.destinationStation,
      departureTimeWindow: userJourney.departureTimeWindow,
      date: userJourney.date,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    db.journeys.push(buddyJourney);

    // Execute match
    const match = executeMatch(userJourney, buddyJourney);
    console.log(`[SIMULATOR] Simulated match created between ${userId} and buddy_99`);

    res.json({ match });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
