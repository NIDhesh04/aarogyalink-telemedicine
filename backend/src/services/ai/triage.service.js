const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Converts raw patient symptoms into a structured clinical brief for doctors.
 * @param {string} rawSymptoms - The raw text provided by the patient.
 * @returns {Promise<string>} - The structured clinical brief.
 */
const generateClinicalBrief = async (rawSymptoms) => {
  if (!rawSymptoms || rawSymptoms.trim().length === 0) {
    return 'No symptoms provided.';
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: `You are a clinical triage assistant for rural telemedicine. 
      Your task is to take raw, informal patient symptoms and convert them into a structured, professional clinical brief for a doctor.
      Focus on:
      1. Chief Complaint
      2. Duration
      3. Severity
      4. Key Symptoms
      Keep it concise and objective. If information is missing, state 'Not reported'.`,
      messages: [
        {
          role: 'user',
          content: `Patient symptoms: "${rawSymptoms}"`,
        },
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error);
    // Fallback to raw symptoms if AI fails
    return `[Raw Symptoms] ${rawSymptoms}`;
  }
};

module.exports = {
  generateClinicalBrief,
};
