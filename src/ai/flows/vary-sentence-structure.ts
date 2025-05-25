'use server';

/**
 * @fileOverview This flow is responsible for generating varied sentence structures,
 * idiomatic expressions, and diverse vocabulary in the AI tutor's responses.
 *
 * - varySentenceStructure - A function that generates responses with varied sentence structure.
 * - VarySentenceStructureInput - The input type for the varySentenceStructure function.
 * - VarySentenceStructureOutput - The return type for the varySentenceStructure function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VarySentenceStructureInputSchema = z.object({
  originalResponse: z.string().describe('The original response to be varied.'),
});
export type VarySentenceStructureInput = z.infer<typeof VarySentenceStructureInputSchema>;

const VarySentenceStructureOutputSchema = z.object({
  variedResponse: z.string().describe('The varied response with diverse sentence structure and vocabulary.'),
});
export type VarySentenceStructureOutput = z.infer<typeof VarySentenceStructureOutputSchema>;

export async function varySentenceStructure(input: VarySentenceStructureInput): Promise<VarySentenceStructureOutput> {
  return varySentenceStructureFlow(input);
}

const varySentenceStructurePrompt = ai.definePrompt({
  name: 'varySentenceStructurePrompt',
  input: {schema: VarySentenceStructureInputSchema},
  output: {schema: VarySentenceStructureOutputSchema},
  prompt: `You are an AI English tutor, and your task is to improve the given response by varying the sentence structure, incorporating idiomatic expressions, and diversifying the vocabulary, so that the user can be exposed to and learn a wide variety of ways to express themselves.

Original Response: {{{originalResponse}}}

Varied Response:`,
});

const varySentenceStructureFlow = ai.defineFlow(
  {
    name: 'varySentenceStructureFlow',
    inputSchema: VarySentenceStructureInputSchema,
    outputSchema: VarySentenceStructureOutputSchema,
  },
  async input => {
    const {output} = await varySentenceStructurePrompt(input);
    return output!;
  }
);
