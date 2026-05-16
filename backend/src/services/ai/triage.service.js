const { GoogleGenerativeAI } = require('@google/generative-ai');

// Teacher checklist: "AI API: prompt engineering for clinical triage"
// Uses Google Gemini 2.5 Flash (fast + cost-efficient for triage)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const TRIAGE_SYSTEM_PROMPT = `You are a senior clinical triage officer working in a rural telemedicine platform in India.
Your job is to convert a patient's informal description of their symptoms into a structured, professional medical brief that a qualified district hospital doctor will read before the consultation.

Structure your output EXACTLY as follows:
**Chief Complaint:** [1 sentence summary]
**Reported Duration:** [how long they've had symptoms]
**Severity:** [Mild / Moderate / Severe based on description]
**Key Symptoms:** [Bulleted list of all reported symptoms]
**Red Flags / Urgent Signs:** [Any alarming symptoms that need immediate attention, or "None reported"]
**Suggested Priority:** [Routine / Urgent / Emergency]

Be concise, clinical, and objective. If information is not mentioned, write "Not reported". Do NOT add any greetings or extra commentary.`;

const PRESCRIPTION_SYSTEM_PROMPT = `You are an AI clinical decision support system assisting a qualified MBBS doctor in a rural telemedicine setting in India.

Based on the patient's structured clinical brief, generate a detailed, evidence-based prescription suggestion that the doctor can review and modify.

Your response must follow this EXACT format:

**Diagnosis (Provisional):** [Most likely diagnosis based on symptoms]

**Medications:**
1. [Drug name] [Dosage] — [Frequency] for [Duration] | Indication: [why]
2. [Drug name] [Dosage] — [Frequency] for [Duration] | Indication: [why]
(add more as needed, use standard generic names)

**General Advice:**
- [Lifestyle / diet / rest recommendations]
- [Activity restrictions if any]
- [Hydration / nutrition advice]

**Follow-up:** [When to return / what to monitor]

**⚠️ Warning Signs — Seek Emergency Care If:**
- [Symptom that requires immediate hospital visit]
- [Another red flag]

---
⚕️ AI-GENERATED SUGGESTION — Doctor must review, verify, and modify before finalizing.

Use only standard, widely available generic medications suitable for rural India. Keep dosages conservative and safe.`;

/**
 * Converts raw patient symptoms into a structured clinical brief.
 * Called inside createBooking before the Booking document is created.
 *
 * @param {string} rawSymptoms - Informal text from the patient.
 * @returns {Promise<string>} - Structured clinical brief for the doctor.
 */
const generateClinicalBrief = async (rawSymptoms) => {
  if (!rawSymptoms || rawSymptoms.trim().length === 0) {
    return 'No symptoms reported by patient.';
  }

  try {
    const prompt = `${TRIAGE_SYSTEM_PROMPT}\n\nPatient's own words: "${rawSymptoms}"\n\nGenerate the clinical brief:`;
    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.error('Gemini Triage Service Error:', error.message);
    // Graceful fallback — booking still succeeds even if AI is unavailable
    return `[AI Triage Unavailable] Patient reported: ${rawSymptoms}`;
  }
};

/**
 * Generates a detailed prescription suggestion for the doctor.
 * Called from POST /api/bookings/ai-suggest when doctor clicks "AI Assist".
 *
 * @param {string} symptomBrief - The structured clinical brief.
 * @returns {Promise<string>} - Suggested prescription text for doctor review.
 */
const generatePrescriptionSuggestion = async (symptomBrief) => {
  if (!symptomBrief || symptomBrief.trim().length === 0) {
    return '';
  }

  try {
    const prompt = `${PRESCRIPTION_SYSTEM_PROMPT}\n\nPatient Clinical Brief:\n${symptomBrief}\n\nGenerate the prescription suggestion for the doctor to review:`;
    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.error('Gemini Prescription Suggestion Error:', error.message);
    return '';
  }
};

module.exports = {
  generateClinicalBrief,
  generatePrescriptionSuggestion,
};