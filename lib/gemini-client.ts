import { GoogleGenerativeAI } from "@google/generative-ai"
import type { DocumentAnalysis } from "./types"

class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
  }

  private ensureServerSide() {
    if (typeof window !== "undefined") {
      throw new Error("GeminiClient can only be used server-side")
    }
  }

  async analyzeDocument(text: string, filename: string): Promise<DocumentAnalysis> {
    this.ensureServerSide()

    if (!this.genAI) {
      throw new Error("Gemini API key not configured")
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `
    You are a legal expert AI. Analyze the following legal document and provide a comprehensive analysis.

    Document: ${filename}
    Content: ${text}

    Please provide your analysis in the following JSON format:
    {
      "overallRiskScore": number (0-100),
      "riskLevel": "low" | "medium" | "high",
      "summary": "Brief summary of the document",
      "recommendations": ["recommendation1", "recommendation2"],
      "clauses": [
        {
          "text": "exact clause text",
          "category": "category name",
          "riskScore": number (0-100),
          "riskLevel": "low" | "medium" | "high",
          "explanation": "detailed explanation",
          "plainLanguage": "simple explanation",
          "analogy": "helpful analogy",
          "recommendations": ["specific recommendations"],
          "position": {"start": number, "end": number}
        }
      ]
    }

    Focus on:
    1. Identifying potentially problematic clauses
    2. Explaining complex legal terms in plain language
    3. Providing risk assessments
    4. Offering practical recommendations
    5. Using analogies to make concepts clear
    `

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const analysisText = response.text()

      // Parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Invalid response format from Gemini")
      }

      const analysisData = JSON.parse(jsonMatch[0])

      return {
        id: crypto.randomUUID(),
        documentId: "",
        overallRiskScore: analysisData.overallRiskScore,
        riskLevel: analysisData.riskLevel,
        clauses: analysisData.clauses.map((clause: any) => ({
          ...clause,
          id: crypto.randomUUID(),
        })),
        summary: analysisData.summary,
        recommendations: analysisData.recommendations,
        analysisTime: Date.now(),
        createdAt: new Date(),
      }
    } catch (error) {
      console.error("Gemini analysis error:", error)
      throw new Error("Failed to analyze document with Gemini AI")
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    this.ensureServerSide()

    if (!this.genAI) {
      throw new Error("Gemini API key not configured")
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `Translate the following text to ${targetLanguage}. Maintain legal accuracy and context:

    ${text}`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error("Translation error:", error)
      throw new Error("Failed to translate text")
    }
  }

  async explainClause(clauseText: string): Promise<{
    explanation: string
    plainLanguage: string
    analogy: string
    risks: string[]
  }> {
    this.ensureServerSide()

    if (!this.genAI) {
      throw new Error("Gemini API key not configured")
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `
    Explain this legal clause in detail:
    "${clauseText}"

    Provide response in JSON format:
    {
      "explanation": "detailed legal explanation",
      "plainLanguage": "simple, everyday language explanation",
      "analogy": "helpful real-world analogy",
      "risks": ["potential risk 1", "potential risk 2"]
    }
    `

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()

      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Invalid response format")
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error("Clause explanation error:", error)
      throw new Error("Failed to explain clause")
    }
  }
}

export const geminiClient = new GeminiClient()
