import { type NextRequest, NextResponse } from "next/server"
import { geminiClient } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  try {
    const { clauseText } = await request.json()

    if (!clauseText) {
      return NextResponse.json({ error: "Missing clause text" }, { status: 400 })
    }

    const explanation = await geminiClient.explainClause(clauseText)

    return NextResponse.json(explanation)
  } catch (error) {
    console.error("Explain clause error:", error)
    return NextResponse.json({ error: "Failed to explain clause" }, { status: 500 })
  }
}
