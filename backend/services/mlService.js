const axios = require('axios');

const GEMINI_API_KEY_MIDDLE = process.env.GEMINI_API_KEY_MIDDLE || 'AIzaSyCSefDWKmdh6PMZBwfiO8F9FqrUCM5D5FY';
const GEMINI_API_KEY_SIDEBAR = process.env.GEMINI_API_KEY_SIDEBAR || 'AIzaSyDu1bLaWs5JVmATYFLhNdMIGZn33BzQpug';
const getGeminiUrl = (isSidebar) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${isSidebar ? GEMINI_API_KEY_SIDEBAR : GEMINI_API_KEY_MIDDLE}`;

const mlService = {
  async detectFake(profileData) {
    try {
      const prompt = `Analyze this profile data for authenticity. Respond STRICTLY in JSON format with exactly these keys: { "isFake": boolean, "score": number(0-100), "confidence": number(0-100), "reasons": string[] }. If bio looks like bot spam, unstructured random text, or very suspicious, score it high for fake. Profile: ${JSON.stringify(profileData)}`;

      const { data } = await axios.post(getGeminiUrl(false), {
        contents: [{ parts: [{ text: prompt }] }]
      });

      const responseText = data.candidates[0].content.parts[0].text;
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.error('Gemini error (detectFake):', err.message);
      return { isFake: false, score: 0, confidence: 0, reasons: [] };
    }
  },
  
  async moderate(text) {
    try {
      const prompt = `Perform toxicity detection on this text. Is it abusive, toxic, or spam? Respond STRICTLY in JSON format with exactly these keys: { "isAbusive": boolean, "score": number(0-100), "categories": string[], "flaggedWords": string[] }. High score = high toxicity. Text: "${text}"`;

      const { data } = await axios.post(getGeminiUrl(false), {
        contents: [{ parts: [{ text: prompt }] }]
      });

      const responseText = data.candidates[0].content.parts[0].text;
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.error('Gemini error (moderate):', err.message);
      return { isAbusive: false, score: 0, categories: [], flaggedWords: [] };
    }
  },

  async szyChat(message, history = [], isSidebar = false) {
    try {
      const formattedHistory = history.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n');
      const promptContext = `You are "Szy", the official AI Chatbot and Protocol Guide for Snapzy. 
You are enthusiastic, technically capable, and highly knowledgeable about blockchain, the Snapzy immutable ledger, and zero-knowledge privacy. 
Keep your responses relatively brief but deeply knowledgeable.
Conversation History:
${formattedHistory}
[USER]: "${message}"
[SZY]:`;

      const { data } = await axios.post(getGeminiUrl(isSidebar), {
        contents: [{ parts: [{ text: promptContext }] }]
      });

      return { reply: data.candidates[0].content.parts[0].text.trim() };
    } catch (err) {
      const details = err.response?.data?.error?.message || err.message;
      console.error('Gemini error (szyChat):', details);
      throw new Error(details);
    }
  }
};

module.exports = mlService;
