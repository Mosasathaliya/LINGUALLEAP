
"use server";

import { correctGrammarAndRespond, CorrectGrammarAndRespondInput } from "@/ai/flows/correct-grammar-and-respond";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { varySentenceStructure, VarySentenceStructureInput } from "@/ai/flows/vary-sentence-structure";

export interface ProcessUserMessageInput {
  userText: string;
  conversationHistory?: CorrectGrammarAndRespondInput['conversationHistory'];
}

export interface ProcessUserMessageOutput {
  aiResponse: string;
  audioDataUri: string;
}

export async function processUserMessage(input: ProcessUserMessageInput): Promise<ProcessUserMessageOutput> {
  try {
    const grammarCorrectionInput: CorrectGrammarAndRespondInput = { 
      userText: input.userText,
      conversationHistory: input.conversationHistory,
    };
    const grammarCorrectionOutput = await correctGrammarAndRespond(grammarCorrectionInput);

    if (!grammarCorrectionOutput || !grammarCorrectionOutput.aiResponse) {
      throw new Error("Failed to get a response from grammar correction flow.");
    }

    const varyStructureInput: VarySentenceStructureInput = { originalResponse: grammarCorrectionOutput.aiResponse };
    const variedStructureOutput = await varySentenceStructure(varyStructureInput);
    
    if (!variedStructureOutput || !variedStructureOutput.variedResponse) {
      throw new Error("Failed to get a response from sentence variation flow.");
    }

    const aiResponseText = variedStructureOutput.variedResponse;

    const ttsOutput = await textToSpeech({ text: aiResponseText });

    return { 
      aiResponse: aiResponseText,
      audioDataUri: ttsOutput.audioDataUri,
    };
  } catch (error) {
    console.error("Error processing user message:", error);
    const fallbackText = "I'm sorry, I encountered an issue. Could you please try again?";
    const fallbackAudio = await textToSpeech({ text: fallbackText });
    return { 
      aiResponse: fallbackText,
      audioDataUri: fallbackAudio.audioDataUri,
    };
  }
}
