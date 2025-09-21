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

    const analytics = await database.getAnalytics(user.id)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Get analytics error:", error)
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 })
  }
}
