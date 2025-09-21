import { type NextRequest, NextResponse } from "next/server"
import { geminiClient } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Missing text or target language" }, { status: 400 })
    }

    // Use Gemini API for real translation
    const translatedText = await geminiClient.translateText(text, targetLanguage)

    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}
