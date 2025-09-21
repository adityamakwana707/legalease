import type { User, Document, DocumentAnalysis, AnalyticsData } from "./types"

// Mock database - replace with Firebase/Firestore in production
export class Database {
  private users: Map<string, User> = new Map()
  private documents: Map<string, Document> = new Map()
  private analyses: Map<string, DocumentAnalysis> = new Map()

  // User operations
  async createUser(email: string, name: string): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: new Date(),
    }
    this.users.set(user.id, user)
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  // Document operations
  async createDocument(userId: string, filename: string, originalText: string): Promise<Document> {
    const document: Document = {
      id: crypto.randomUUID(),
      userId,
      filename,
      originalText,
      uploadedAt: new Date(),
      analysisStatus: "pending",
    }
    this.documents.set(document.id, document)
    return document
  }

  async updateDocumentAnalysis(documentId: string, analysis: DocumentAnalysis): Promise<void> {
    const document = this.documents.get(documentId)
    if (document) {
      document.analysisStatus = "completed"
      document.analysisResult = analysis
      analysis.documentId = documentId
      this.analyses.set(analysis.id, analysis)
    }
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter((doc) => doc.userId === userId)
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.documents.get(id) || null
  }

  async getAnalysis(documentId: string): Promise<DocumentAnalysis | null> {
    for (const analysis of this.analyses.values()) {
      if (analysis.documentId === documentId) {
        return analysis
      }
    }
    return null
  }

  // Analytics operations
  async getAnalytics(userId: string): Promise<AnalyticsData> {
    const userDocuments = await this.getDocumentsByUser(userId)
    const completedDocs = userDocuments.filter((doc) => doc.analysisStatus === "completed")

    let totalHighRiskClauses = 0
    let totalRiskScore = 0
    let totalAnalysisTime = 0
    const clauseCategories = new Map<string, { count: number; riskLevel: "low" | "medium" | "high" }>()
    const documentTypes = new Map<string, { count: number; totalRisk: number }>()

    for (const doc of completedDocs) {
      if (doc.analysisResult) {
        const analysis = doc.analysisResult
        totalRiskScore += analysis.overallRiskScore
        totalAnalysisTime += analysis.analysisTime

        // Count high risk clauses
        const highRiskClauses = analysis.clauses.filter((clause) => clause.riskLevel === "high")
        totalHighRiskClauses += highRiskClauses.length

        // Categorize clauses
        for (const clause of analysis.clauses) {
          const existing = clauseCategories.get(clause.category) || { count: 0, riskLevel: "low" as const }
          clauseCategories.set(clause.category, {
            count: existing.count + 1,
            riskLevel:
              clause.riskLevel === "high" ? "high" : existing.riskLevel === "medium" ? "medium" : clause.riskLevel,
          })
        }

        // Document types
        const fileExt = doc.filename.split(".").pop()?.toLowerCase() || "unknown"
        const existing = documentTypes.get(fileExt) || { count: 0, totalRisk: 0 }
        documentTypes.set(fileExt, {
          count: existing.count + 1,
          totalRisk: existing.totalRisk + analysis.overallRiskScore,
        })
      }
    }

    // Generate mock risk trends (last 7 days)
    const riskTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toISOString().split("T")[0],
        low: Math.floor(Math.random() * 10) + 5,
        medium: Math.floor(Math.random() * 8) + 3,
        high: Math.floor(Math.random() * 5) + 1,
      }
    })

    return {
      totalDocuments: completedDocs.length,
      highRiskClauses: totalHighRiskClauses,
      averageRiskScore: completedDocs.length > 0 ? Math.round(totalRiskScore / completedDocs.length) : 0,
      averageAnalysisTime: completedDocs.length > 0 ? Math.round(totalAnalysisTime / completedDocs.length) : 0,
      riskTrends,
      clauseCategories: Array.from(clauseCategories.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        riskLevel: data.riskLevel,
      })),
      documentTypes: Array.from(documentTypes.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        averageRisk: Math.round(data.totalRisk / data.count),
      })),
      recentActivity: completedDocs.slice(-5).map((doc) => ({
        id: doc.id,
        type: "analysis" as const,
        document: doc.filename,
        timestamp: doc.uploadedAt,
        riskLevel: doc.analysisResult?.riskLevel || "low",
      })),
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Remove from documents
    this.documents.delete(documentId)

    // Remove associated analysis
    this.analyses.forEach((analysis, key) => {
      if (analysis.documentId === documentId) {
        this.analyses.delete(key)
      }
    })

    // In real implementation, this would delete from Firestore
    console.log(`Document ${documentId} deleted`)
  }

  async getUserDocumentCount(userId: string): Promise<number> {
    return Array.from(this.documents.values()).filter((doc) => doc.userId === userId).length
  }

  async getRiskTrends(
    userId: string,
    days = 30,
  ): Promise<
    Array<{
      date: string
      high: number
      medium: number
      low: number
    }>
  > {
    const userDocuments = Array.from(this.documents.values()).filter((doc) => doc.userId === userId)
    const userAnalyses = Array.from(this.analyses.values()).filter((analysis) =>
      userDocuments.some((doc) => doc.id === analysis.documentId),
    )

    // Group by date and count risk levels
    const trends: Record<string, { high: number; medium: number; low: number }> = {}

    userAnalyses.forEach((analysis) => {
      const date = new Date(analysis.createdAt).toISOString().split("T")[0]
      if (!trends[date]) {
        trends[date] = { high: 0, medium: 0, low: 0 }
      }
      trends[date][analysis.riskLevel]++
    })

    return Object.entries(trends)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .slice(-days)
  }
}

// Export a singleton instance
export const database = new Database()
