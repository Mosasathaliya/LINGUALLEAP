
"use server";

import { correctGrammarAndRespond, CorrectGrammarAndRespondInput } from "@/ai/flows/correct-grammar-and-respond";
import { varySentenceStructure, VarySentenceStructureInput } from "@/ai/flows/vary-sentence-structure";

export interface ProcessUserMessageInput {
  userText: string;
  conversationHistory?: CorrectGrammarAndRespondInput['conversationHistory'];
}

export interface ProcessUserMessageOutput {
  aiResponse: string;
}

export async function processUserMessage(input: ProcessUserMessageInput): Promise<ProcessUserMessageOutput> {
  try {
    // Step 1: Correct grammar and get initial AI response
    const grammarCorrectionInput: CorrectGrammarAndRespondInput = { 
      userText: input.userText,
      conversationHistory: input.conversationHistory,
    };
    const grammarCorrectionOutput = await correctGrammarAndRespond(grammarCorrectionInput);

    if (!grammarCorrectionOutput || !grammarCorrectionOutput.aiResponse) {
      throw new Error("Failed to get a response from grammar correction flow.");
    }

    // Step 2: Vary sentence structure of the AI's response
    const varyStructureInput: VarySentenceStructureInput = { originalResponse: grammarCorrectionOutput.aiResponse };
    const variedStructureOutput = await varySentenceStructure(varyStructureInput);
    
    if (!variedStructureOutput || !variedStructureOutput.variedResponse) {
      throw new Error("Failed to get a response from sentence variation flow.");
    }

    return { aiResponse: variedStructureOutput.variedResponse };
  } catch (error) {
    console.error("Error processing user message:", error);
    // Fallback response in case of an error
    return { aiResponse: "I'm sorry, I encountered an issue. Could you please try again?" };
  }
}
