import { type NextRequest, NextResponse } from "next/server"
import { database } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = request.cookies.get("auth-token")?.value
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await database.getUserById(authToken)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const document = await database.getDocument(params.id)
    if (!document || document.userId !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const analysis = await database.getAnalysis(document.id)

    return NextResponse.json({
      document,
      analysis,
    })
  } catch (error) {
    console.error("Get document error:", error)
    return NextResponse.json({ error: "Failed to get document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = request.cookies.get("auth-token")?.value
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await database.getUserById(authToken)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const document = await database.getDocument(params.id)
    if (!document || document.userId !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    await database.deleteDocument(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
