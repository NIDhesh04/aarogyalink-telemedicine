const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * AI Triage Service (Gemini Edition)
 * Managed by: Teammate 4 (Group Lead)
 * Purpose: Convert raw patient text into structured clinical data for doctors.
 */

// Initialize Gemini with the free API key from your .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Converts raw patient symptoms into a structured clinical brief.
 * @param {string} rawSymptoms - The informal text provided by the patient.
 * @returns {Promise<string>} - The structured clinical brief (Markdown formatted).
 */
const generateClinicalBrief = async (rawSymptoms) => {
  // Guard clause for empty or missing input
  if (!rawSymptoms || rawSymptoms.trim().length === 0) {
    return 'No symptoms reported by patient.';
  }

  try {
    // Using gemini-1.5-flash for high speed and zero cost[cite: 26, 40]
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are a clinical triage assistant for rural telemedicine. 
        Your task is to take raw, informal patient symptoms and convert them into a structured, professional clinical brief for a doctor.
        Focus on:
        1. Chief Complaint
        2. Duration
        3. Severity
        4. Key Symptoms
        Keep it concise and objective. If information is missing, state 'Not reported'.`
    });

    const prompt = `Patient symptoms: "${rawSymptoms}"`;

    // Generate content from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini Triage Service Error:', error);
    
    // Fallback logic: Ensure the doctor still sees the patient's original words
    // even if the AI service is down or rate-limited.[cite: 26]
    return `[System Note: AI Triage Unavailable] Raw Symptoms: ${rawSymptoms}`;
  }
};

module.exports = {
  generateClinicalBrief,
};