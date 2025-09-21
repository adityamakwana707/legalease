import { type NextRequest, NextResponse } from "next/server"
import { database } from "@/lib/database"
import { geminiClient } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await database.getUserById(authToken)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const filename = formData.get("filename") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Extract text from file
    const text = await file.text()

    // Create document record
    const document = await database.createDocument(user.id, filename, text)

    // Start analysis in background
    try {
      const analysis = await geminiClient.analyzeDocument(text, filename)
      await database.updateDocumentAnalysis(document.id, analysis)
    } catch (analysisError) {
      console.error("Analysis failed:", analysisError)
      // Document is still saved, analysis can be retried
    }

    return NextResponse.json({
      documentId: document.id,
      message: "Document uploaded and analysis started",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
