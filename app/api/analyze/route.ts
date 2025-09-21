import { type NextRequest, NextResponse } from "next/server"

// Mock Gemini API integration
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Simulate file processing and Gemini API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock analysis results
    const mockAnalysis = {
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      clauses: [
        {
          id: "1",
          text: "The Company may terminate this agreement at any time without cause by providing thirty (30) days written notice to the User.",
          summary:
            "The company can end this agreement anytime with just 30 days notice, even without a specific reason.",
          riskLevel: "medium",
          riskScore: 65,
          analogy:
            "Like a landlord who can ask you to move out with a month's notice, even if you've been a good tenant.",
          category: "Termination",
        },
        {
          id: "2",
          text: "User agrees to indemnify and hold harmless the Company from any claims, damages, or expenses arising from User's use of the Service.",
          summary:
            "You must protect the company and pay for any legal problems that come from your use of their service.",
          riskLevel: "high",
          riskScore: 85,
          analogy:
            "Like agreeing to pay for any damage if you borrow someone's car, even if the accident wasn't entirely your fault.",
          category: "Liability",
        },
      ],
      overallRiskScore: 72,
      riskLevel: "medium",
    }

    return NextResponse.json(mockAnalysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
