// src/ai/flows/suggest-financial-categories.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests relevant financial categories
 * based on the description of an expense.
 *
 * - suggestFinancialCategories - A function that suggests financial categories for a given expense description.
 * - SuggestFinancialCategoriesInput - The input type for the suggestFinancialCategories function.
 * - SuggestFinancialCategoriesOutput - The return type for the suggestFinancialCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFinancialCategoriesInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the expense for which to suggest categories.'),
});

export type SuggestFinancialCategoriesInput = z.infer<
  typeof SuggestFinancialCategoriesInputSchema
>;

const SuggestFinancialCategoriesOutputSchema = z.object({
  categories: z
    .array(z.string())
    .describe('An array of suggested financial categories.'),
});

export type SuggestFinancialCategoriesOutput = z.infer<
  typeof SuggestFinancialCategoriesOutputSchema
>;

export async function suggestFinancialCategories(
  input: SuggestFinancialCategoriesInput
): Promise<SuggestFinancialCategoriesOutput> {
  return suggestFinancialCategoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFinancialCategoriesPrompt',
  input: {schema: SuggestFinancialCategoriesInputSchema},
  output: {schema: SuggestFinancialCategoriesOutputSchema},
  prompt: `You are an expert financial advisor. Given the following description of an expense, suggest a list of relevant financial categories that could be used to classify it.

Description: {{{description}}}

Categories:`,
});

const suggestFinancialCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestFinancialCategoriesFlow',
    inputSchema: SuggestFinancialCategoriesInputSchema,
    outputSchema: SuggestFinancialCategoriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
