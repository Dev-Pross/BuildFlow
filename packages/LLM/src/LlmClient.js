import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
class LLMClient {
    async call(prompt, options) {
        const GEMINI_URL = process.env.GEMINI_URL ||
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY)
            throw new Error("GEMINI API KEY not specified (why env is not working?)");
        if (!GEMINI_URL)
            throw new Error("GEMINI URL not specified (why env is not working?)");
        console.log("making the gemini call");
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                // stopSequencies: [
                //   "Title"
                // ],
                temperature: options.temperature,
                maxOutputTokens: options.maxOutputTokens
            }
        };
        try {
            const response = await axios.post(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            console.log("LLM Response:", response.data);
            const actuaResponse = response.data.candidates[0].content.parts[0];
            // console.log("THe outpusssst is ", actuaResponse.text);
            const inputToknes = response.data.usageMetadata.promptTokenCount;
            const outputTOkens = response.data.usageMetadata.candidatesTokenCount;
            const totalTokenCount = response.data.usageMetadata.totalTokenCount;
            return {
                text: actuaResponse.text,
                inputTokens: inputToknes,
                outputTokens: outputTOkens,
                totalCount: totalTokenCount
            };
        }
        catch (e) {
            if (e?.response) {
                console.error(`LLM call failed with status ${e.response.status}:`);
                console.log(e.response.data.error.message);
            }
            else {
                console.error("Error in calling the LLM:", e);
            }
            throw new Error("Failed to fetch response from Gemini API: " +
                (e?.message || "Unknown error"));
        }
    }
}
export default LLMClient;
