/**
 * translation.ts
 * Auto-translation helper for EquipHK
 *
 * Translates English equipment names and descriptions into Traditional Chinese (zh-HK)
 * using the built-in LLM helper. Called after create/update of equipment items,
 * consumables, and bundles to keep nameZh / descriptionZh columns populated.
 */

import { invokeLLM } from "./_core/llm";

export interface TranslationResult {
  nameZh: string;
  descriptionZh: string;
}

/**
 * Translate a single item's name and description into Traditional Chinese (zh-HK).
 * Returns empty strings on failure so callers can still proceed without crashing.
 */
export async function translateToZhHK(
  name: string,
  description: string
): Promise<TranslationResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator specialising in Hong Kong Traditional Chinese (zh-HK).
You translate English product names and descriptions for a construction and industrial equipment rental company based in Hong Kong.
Use natural, professional Hong Kong Cantonese-influenced written Chinese.
Return ONLY a JSON object with two keys: "nameZh" and "descriptionZh". No extra text.`,
        },
        {
          role: "user",
          content: `Translate the following equipment item into Traditional Chinese (zh-HK):

Name: ${name}
Description: ${description}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              nameZh: {
                type: "string",
                description: "Traditional Chinese (zh-HK) translation of the equipment name",
              },
              descriptionZh: {
                type: "string",
                description:
                  "Traditional Chinese (zh-HK) translation of the equipment description",
              },
            },
            required: ["nameZh", "descriptionZh"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[translation] LLM returned empty content");
      return { nameZh: "", descriptionZh: "" };
    }

    const parsed: TranslationResult =
      typeof content === "string" ? JSON.parse(content) : content;

    return {
      nameZh: parsed.nameZh ?? "",
      descriptionZh: parsed.descriptionZh ?? "",
    };
  } catch (err) {
    console.error("[translation] Failed to translate:", err);
    return { nameZh: "", descriptionZh: "" };
  }
}

/**
 * Fire-and-forget wrapper — translates and updates a DB row asynchronously.
 * Accepts an update function so callers don't need to import DB helpers here.
 */
export function scheduleTranslation(
  name: string,
  description: string,
  onComplete: (result: TranslationResult) => Promise<void>
): void {
  translateToZhHK(name, description)
    .then(onComplete)
    .catch((err) => {
      console.error("[translation] scheduleTranslation error:", err);
    });
}
