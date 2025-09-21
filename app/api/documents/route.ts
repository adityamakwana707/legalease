import { type NextRequest, NextResponse } from "next/server"
import { database } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await database.getUserById(authToken)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const documents = await database.getDocumentsByUser(user.id)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Get documents error:", error)
    return NextResponse.json({ error: "Failed to get documents" }, { status: 500 })
  }
}
