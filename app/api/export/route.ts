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

    const { documentId, format } = await request.json()

    if (!documentId || !format) {
      return NextResponse.json({ error: "Missing documentId or format" }, { status: 400 })
    }

    const document = await database.getDocument(documentId)
    if (!document || document.userId !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const analysis = await database.getAnalysis(documentId)
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    // Generate export data based on format
    let exportData: any
    let contentType: string
    let filename: string

    switch (format) {
      case "json":
        exportData = JSON.stringify({ document, analysis }, null, 2)
        contentType = "application/json"
        filename = `${document.filename}_analysis.json`
        break
      case "csv":
        // Convert clauses to CSV format
        const csvHeaders = "Clause,Category,Risk Level,Risk Score,Plain Language\n"
        const csvRows = analysis.clauses
          .map(
            (clause) =>
              `"${clause.text}","${clause.category}","${clause.riskLevel}","${clause.riskScore}","${clause.plainLanguage}"`,
          )
          .join("\n")
        exportData = csvHeaders + csvRows
        contentType = "text/csv"
        filename = `${document.filename}_analysis.csv`
        break
      default:
        return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
    }

    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export document" }, { status: 500 })
  }
}
