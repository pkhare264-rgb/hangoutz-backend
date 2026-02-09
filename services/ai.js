/**
 * AI Content Moderation Service
 * You can integrate with services like:
 * - OpenAI Moderation API
 * - Google Cloud Natural Language API
 * - AWS Comprehend
 * - Perspective API
 * 
 * For now, this is a basic implementation with keyword filtering
 */

// Banned words/phrases (expand as needed)
const BANNED_KEYWORDS = [
  'spam', 'scam', 'fraud', 'hate', 'violence', 'abuse',
  'harassment', 'explicit', 'nsfw', 'drugs', 'illegal'
];

// Pattern-based detection
const SUSPICIOUS_PATTERNS = [
  /\b(?:https?:\/\/)?(?:bit\.ly|tinyurl|goo\.gl)\/\w+/gi, // Shortened URLs
  /\b\d{16}\b/, // Credit card numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers (US format)
  /(buy|click|download|install|register)\s+(now|here|today)/gi, // Spam phrases
];

/**
 * Moderate text content
 */
export const moderateText = async (text) => {
  const lowerText = text.toLowerCase();
  
  // Check for banned keywords
  for (const keyword of BANNED_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        flagged: true,
        reason: `Content contains restricted term: "${keyword}"`,
        severity: 'high'
      };
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        reason: 'Content contains suspicious pattern (spam/phishing)',
        severity: 'medium'
      };
    }
  }

  // Check for excessive caps (possible shouting/spam)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 20) {
    return {
      flagged: true,
      reason: 'Excessive use of capital letters',
      severity: 'low'
    };
  }

  // Check for repeated characters (spam)
  if (/(.)\1{5,}/.test(text)) {
    return {
      flagged: true,
      reason: 'Suspicious repeated characters',
      severity: 'low'
    };
  }

  return {
    flagged: false,
    reason: null,
    severity: null
  };
};

/**
 * Moderate image (placeholder for actual image moderation)
 * Integrate with services like:
 * - AWS Rekognition
 * - Google Cloud Vision API
 * - Azure Content Moderator
 */
export const moderateImage = async (imageUrl) => {
  // TODO: Implement actual image moderation
  // For now, just return safe
  return {
    flagged: false,
    reason: null,
    labels: []
  };
};

/**
 * Calculate user trust score based on behavior
 */
export const calculateTrustScore = (user, recentActivity) => {
  let score = user.trustScore || 50;

  // Verified users get bonus
  if (user.verified) {
    score += 10;
  }

  // Account age bonus
  const accountAgeDays = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
  if (accountAgeDays > 30) score += 5;
  if (accountAgeDays > 90) score += 5;

  // Activity bonuses
  if (recentActivity?.eventsHosted > 0) score += 5;
  if (recentActivity?.eventsAttended > 5) score += 5;
  if (recentActivity?.messagesModerated > 0) score -= 10; // Penalty for moderated content

  // Cap between 0 and 100
  return Math.max(0, Math.min(100, score));
};

/**
 * Get AI chat response (basic implementation)
 * Replace with actual AI service like OpenAI, Claude, etc.
 */
export const getAIChatResponse = async (message, conversationHistory = []) => {
  const lowerMessage = message.toLowerCase();

  // Basic pattern matching responses
  const responses = {
    greeting: "Hey there! 👋 Welcome to Hangoutz! I'm your AI guide for all things Raipur. Ask me about events, food, places to visit, or anything else about the city!",
    events: "There are several exciting events coming up in Raipur! 🎉 Check out the home screen to see all current events and join the ones that interest you!",
    food: "Raipur has amazing food! 🍔 Try the street food in Purani Basti, fine dining at Magneto Mall, or check out food-themed events!",
    places: "Must-visit places in Raipur! 📍\n\n1. Marine Drive at Telibandha Lake\n2. Nandan Van Zoo & Safari\n3. Purkhauti Muktangan\n4. Mahant Ghasidas Museum\n\nSome might have events happening too!",
    help: "I can help you with:\n\n🎉 Finding events\n🍔 Food recommendations\n📍 Places to visit\n🌤️ Weather info\n💡 City tips\n\nWhat would you like to know?",
    default: "That's interesting! 🏙️ I'm here to help you discover Raipur. Try asking about events, food, places to visit, or local tips!"
  };

  // Pattern matching
  if (/\b(hi|hello|hey|namaste)\b/i.test(lowerMessage)) {
    return responses.greeting;
  }
  if (/\b(event|happening|what'?s on)\b/i.test(lowerMessage)) {
    return responses.events;
  }
  if (/\b(food|eat|restaurant|khana)\b/i.test(lowerMessage)) {
    return responses.food;
  }
  if (/\b(place|visit|tourist|see)\b/i.test(lowerMessage)) {
    return responses.places;
  }
  if (/\b(help|what can you)\b/i.test(lowerMessage)) {
    return responses.help;
  }

  return responses.default;
};
