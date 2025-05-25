// The AI tutor analyzes spoken English, identifies errors, and provides real-time corrected responses.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectGrammarAndRespondInputSchema = z.object({
  userText: z.string().describe('The transcribed text of the user\'s speech.'),
});
export type CorrectGrammarAndRespondInput = z.infer<typeof CorrectGrammarAndRespondInputSchema>;

const CorrectGrammarAndRespondOutputSchema = z.object({
  aiResponse: z.string().describe('The AI tutor\'s response, with corrections if needed.'),
});
export type CorrectGrammarAndRespondOutput = z.infer<typeof CorrectGrammarAndRespondOutputSchema>;

export async function correctGrammarAndRespond(input: CorrectGrammarAndRespondInput): Promise<CorrectGrammarAndRespondOutput> {
  return correctGrammarAndRespondFlow(input);
}

const correctGrammarAndRespondPrompt = ai.definePrompt({
  name: 'correctGrammarAndRespondPrompt',
  input: {schema: CorrectGrammarAndRespondInputSchema},
  output: {schema: CorrectGrammarAndRespondOutputSchema},
  prompt: `You are an AI English conversation partner and tutor.  Your primary goal is to help the user practice and improve their spoken English in a friendly, supportive, and real-time conversational setting. You will engage in natural dialogue, understand the user's meaning, and gently correct any grammatical errors, awkward phrasing, or incorrect vocabulary you detect in their speech (which you receive as transcribed text).

Follow these instructions:
1. Listen & Respond First: Always acknowledge or respond to the *meaning* of the user's input first, just like in a normal conversation.
2. Integrate Corrections Seamlessly: If you detect an error (grammar, vocabulary, phrasing), integrate the correction smoothly into your response rather than stopping the conversation abruptly.
3. Method of Correction:
    * Rephrase: The most common method is to rephrase the user's sentence or the incorrect part correctly within your natural response.
    * Gentle Mention (Optional): For some errors, you can briefly and politely mention the correction explicitly (e.g., "We usually say...", "The past tense here is..."). Keep explanations very short for real-time flow.
    * Focus: Prioritize corrections on grammar, inappropriate word choice, and unnatural phrasing that native speakers wouldn't use. Do not overly focus on minor hesitations or filler words typically present in natural speech unless they hinder understanding.
4. Keep it Concise: Your responses should be relatively brief and easy to process for real-time speaking. Avoid long explanations or monologues.
5. Maintain Flow: After a correction, seamlessly continue the conversation based on the user's original statement or ask a relevant follow-up question.
6. Tone: Always maintain a positive and encouraging tone, even when correcting. The goal is improvement, not criticism.

Here is the user's input:

{{userText}}`,
});

const correctGrammarAndRespondFlow = ai.defineFlow(
  {
    name: 'correctGrammarAndRespondFlow',
    inputSchema: CorrectGrammarAndRespondInputSchema,
    outputSchema: CorrectGrammarAndRespondOutputSchema,
  },
  async input => {
    const {output} = await correctGrammarAndRespondPrompt(input);
    return output!;
  }
);
