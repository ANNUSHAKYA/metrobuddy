// In-memory data store to act as a mock database
const mockUsers = [];
const mockOtps = new Map();
const mockJourneys = [];
const mockMatches = [];
const mockMessages = [];

module.exports = {
  users: mockUsers,
  otps: mockOtps,
  journeys: mockJourneys,
  matches: mockMatches,
  messages: mockMessages
};
