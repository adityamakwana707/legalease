import { type NextRequest, NextResponse } from "next/server"
import { database } from "@/lib/database"

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

    const { documentIds } = await request.json()

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      return NextResponse.json({ error: "Need at least 2 documents to compare" }, { status: 400 })
    }

    // Get documents and their analyses
    const documents = await Promise.all(
      documentIds.map(async (id: string) => {
        const doc = await database.getDocument(id)
        if (!doc || doc.userId !== user.id) {
          throw new Error(`Document ${id} not found or unauthorized`)
        }
        const analysis = await database.getAnalysis(id)
        return { document: doc, analysis }
      }),
    )

    // Use Gemini to compare documents
    const comparisonPrompt = `
    Compare these legal documents and their analyses. Identify:
    1. Common clauses and their differences
    2. Risk level variations
    3. Missing clauses in each document
    4. Recommendations for harmonization

    Documents:
    ${documents
      .map(
        (d, i) => `
    Document ${i + 1}: ${d.document.filename}
    Risk Score: ${d.analysis?.overallRiskScore || "N/A"}
    Clauses: ${d.analysis?.clauses.length || 0}
    `,
      )
      .join("\n")}

    Provide comparison in JSON format:
    {
      "summary": "Overall comparison summary",
      "commonClauses": [{"clause": "text", "differences": ["diff1", "diff2"]}],
      "uniqueClauses": [{"document": "filename", "clauses": ["clause1", "clause2"]}],
      "riskComparison": {"highest": "filename", "lowest": "filename", "analysis": "text"},
      "recommendations": ["rec1", "rec2"]
    }
    `

    // This would use Gemini API for comparison
    // For now, return a basic comparison structure
    const comparison = {
      summary: `Compared ${documents.length} documents`,
      commonClauses: [],
      uniqueClauses: documents.map((d) => ({
        document: d.document.filename,
        clauses: d.analysis?.clauses.map((c) => c.text) || [],
      })),
      riskComparison: {
        highest: documents.reduce((prev, curr) =>
          (curr.analysis?.overallRiskScore || 0) > (prev.analysis?.overallRiskScore || 0) ? curr : prev,
        ).document.filename,
        lowest: documents.reduce((prev, curr) =>
          (curr.analysis?.overallRiskScore || 100) < (prev.analysis?.overallRiskScore || 100) ? curr : prev,
        ).document.filename,
        analysis: "Risk analysis comparison",
      },
      recommendations: ["Review high-risk clauses", "Consider standardizing terms"],
    }

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error("Compare documents error:", error)
    return NextResponse.json({ error: "Failed to compare documents" }, { status: 500 })
  }
}
