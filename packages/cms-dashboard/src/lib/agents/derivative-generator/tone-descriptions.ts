/**
 * Tone Profile Descriptions for Derivative Generation
 * These descriptions guide the LLM to generate content in the appropriate tone
 */

import type { ToneProfileId } from "@/lib/types";

export const TONE_DESCRIPTIONS: Record<ToneProfileId, string> = {
  "TP-01": `**Neutral-Informative**
- Direct, factual communication
- No emotional coloring or excessive empathy
- Present information objectively
- Focus on clarity and accuracy
- Let facts speak for themselves`,

  "TP-02": `**Empathic-Neutral**
- Acknowledge the patient's situation with warmth
- Use reassuring language where appropriate
- Balance professionalism with understanding
- "We understand this can be a significant decision..."
- Show support without being overly emotional`,

  "TP-03": `**Reflective-Contextual**
- Provide broader context and background
- Explain the "why" behind recommendations
- Help patients understand the bigger picture
- Connect information to their daily life
- Thoughtful, educational approach`,

  "TP-04": `**Stability-Frame (Anxiety-Sensitive)**
- Emphasize safety and established procedures
- Use calm, steady language
- Avoid alarming terminology
- BANNED WORDS: surgery, operation, invasive, drill, cut, painful, risk, complication, dangerous
- Focus on comfort and control
- "You'll be in safe hands throughout the process..."`,

  "TP-05": `**Expectation-Calibration**
- Present realistic expectations
- Balance optimism with honesty
- Discuss both benefits and limitations
- Help patients understand typical outcomes
- "Results can vary, but typically..."`,

  "TP-06": `**Autonomy-Respecting**
- Emphasize patient choice and control
- Present options without pressure
- Respect patient's decision-making capacity
- "The choice is entirely yours..."
- Support informed decision-making`,
};
