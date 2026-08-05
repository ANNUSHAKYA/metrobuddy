const supabase = require('./supabaseClient');

// In-memory cache synced with Supabase
const mockUsers = [];
const mockOtps = new Map();
const mockJourneys = [];
const mockMatches = [];
const mockMessages = [];

// Helper to safely execute Supabase queries without throwing uncaught errors
async function safeQuery(fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn('[Supabase DB Notice]', err.message);
    return null;
  }
}

// ─── USER OPERATIONS ──────────────────────────────────────────
async function findUserByPhone(phone) {
  const local = mockUsers.find(u => u.phone === phone);
  if (local) return local;

  const res = await safeQuery(() => supabase.from('users').select('*').eq('phone', phone).single());
  if (res && res.data) {
    const user = {
      id: res.data.id,
      phone: res.data.phone,
      email: res.data.email || null,
      anonymousHandle: res.data.anonymous_handle,
      verificationTier: res.data.verification_tier,
      trustScore: res.data.trust_score
    };
    if (!mockUsers.find(u => u.id === user.id)) mockUsers.push(user);
    return user;
  }
  return null;
}

async function findUserByEmail(email) {
  const normalized = email.toLowerCase().trim();
  const local = mockUsers.find(u => u.email && u.email.toLowerCase() === normalized);
  if (local) return local;

  const res = await safeQuery(() => supabase.from('users').select('*').eq('email', normalized).single());
  if (res && res.data) {
    const user = {
      id: res.data.id,
      phone: res.data.phone || null,
      email: res.data.email,
      anonymousHandle: res.data.anonymous_handle,
      verificationTier: res.data.verification_tier,
      trustScore: res.data.trust_score
    };
    if (!mockUsers.find(u => u.id === user.id)) mockUsers.push(user);
    return user;
  }
  return null;
}

async function findUserById(id) {
  const local = mockUsers.find(u => u.id === id);
  if (local) return local;

  const res = await safeQuery(() => supabase.from('users').select('*').eq('id', id).single());
  if (res && res.data) {
    const user = {
      id: res.data.id,
      phone: res.data.phone,
      anonymousHandle: res.data.anonymous_handle,
      verificationTier: res.data.verification_tier,
      trustScore: res.data.trust_score
    };
    if (!mockUsers.find(u => u.id === user.id)) mockUsers.push(user);
    return user;
  }
  return null;
}

async function createUser(user) {
  if (!mockUsers.find(u => u.id === user.id)) {
    mockUsers.push(user);
  }
  await safeQuery(() => supabase.from('users').insert([{
    id: user.id,
    phone: user.phone || null,
    email: user.email ? user.email.toLowerCase().trim() : null,
    anonymous_handle: user.anonymousHandle,
    verification_tier: user.verificationTier || 1,
    trust_score: user.trustScore || 100
  }]));
  return user;
}

async function updateUserHandle(userId, handle) {
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    user.anonymousHandle = handle;
  }
  await safeQuery(() => supabase.from('users').update({ anonymous_handle: handle }).eq('id', userId));
  return user;
}

// ─── OTP OPERATIONS ───────────────────────────────────────────
async function setOtp(phone, otp) {
  mockOtps.set(phone, otp);
  await safeQuery(() => supabase.from('otps').upsert([{ phone, otp }]));
}

async function getOtp(phone) {
  if (mockOtps.has(phone)) return mockOtps.get(phone);
  const res = await safeQuery(() => supabase.from('otps').select('*').eq('phone', phone).single());
  if (res && res.data) {
    mockOtps.set(phone, res.data.otp);
    return res.data.otp;
  }
  return null;
}

async function deleteOtp(phone) {
  mockOtps.delete(phone);
  await safeQuery(() => supabase.from('otps').delete().eq('phone', phone));
}

// ─── JOURNEY OPERATIONS ───────────────────────────────────────
async function createJourney(journey) {
  mockJourneys.push(journey);
  await safeQuery(() => supabase.from('journeys').insert([{
    id: journey.id,
    user_id: journey.userId,
    departure_station: journey.departureStation,
    destination_station: journey.destinationStation,
    departure_time_window: journey.departureTimeWindow,
    date: journey.date,
    status: journey.status || 'active'
  }]));
  return journey;
}

async function updateJourneyStatus(journeyId, status) {
  const j = mockJourneys.find(item => item.id === journeyId);
  if (j) j.status = status;
  await safeQuery(() => supabase.from('journeys').update({ status }).eq('id', journeyId));
}

// ─── MATCH OPERATIONS ─────────────────────────────────────────
async function createMatch(match) {
  mockMatches.push(match);
  await safeQuery(() => supabase.from('matches').insert([{
    id: match.id,
    user1_id: match.user1.id,
    user1_handle: match.user1.handle,
    user2_id: match.user2.id,
    user2_handle: match.user2.handle,
    journey1_id: match.journey1Id,
    journey2_id: match.journey2Id,
    departure_station: match.departureStation,
    destination_station: match.destinationStation,
    meetup_spot: match.meetupSpot,
    status: match.status || 'active'
  }]));
  return match;
}

async function updateMatchStatus(matchId, status) {
  const m = mockMatches.find(item => item.id === matchId);
  if (m) m.status = status;
  await safeQuery(() => supabase.from('matches').update({ status }).eq('id', matchId));
}

// ─── MESSAGE OPERATIONS ───────────────────────────────────────
async function createMessage(msg) {
  mockMessages.push(msg);
  await safeQuery(() => supabase.from('messages').insert([{
    id: msg.id,
    match_id: msg.matchId,
    sender_id: msg.senderId,
    type: msg.type,
    content: msg.content,
    media_url: msg.mediaUrl,
    view_once: msg.viewOnce || false,
    is_opened: msg.isOpened || false,
    duration: msg.duration || null
  }]));
  return msg;
}

async function revealViewOnceMessage(messageId) {
  const msg = mockMessages.find(m => m.id === messageId);
  if (msg) {
    msg.isOpened = true;
    msg.mediaUrl = null;
    msg.content = 'Opened';
  }
  await safeQuery(() => supabase.from('messages').update({
    is_opened: true,
    media_url: null,
    content: 'Opened'
  }).eq('id', messageId));
  return msg;
}

async function purgeMatchMessages(matchId) {
  for (let i = mockMessages.length - 1; i >= 0; i--) {
    if (mockMessages[i].matchId === matchId) {
      mockMessages.splice(i, 1);
    }
  }
  await safeQuery(() => supabase.from('messages').delete().eq('match_id', matchId));
}

module.exports = {
  // Direct arrays for backwards-compatible synchronous array references
  users: mockUsers,
  otps: mockOtps,
  journeys: mockJourneys,
  matches: mockMatches,
  messages: mockMessages,

  // Supabase Async API Methods
  findUserByPhone,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserHandle,
  setOtp,
  getOtp,
  deleteOtp,
  createJourney,
  updateJourneyStatus,
  createMatch,
  updateMatchStatus,
  createMessage,
  revealViewOnceMessage,
  purgeMatchMessages
};
