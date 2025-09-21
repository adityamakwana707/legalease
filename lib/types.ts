export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Document {
  id: string
  userId: string
  filename: string
  originalText: string
  uploadedAt: Date
  analysisStatus: "pending" | "analyzing" | "completed" | "error"
  analysisResult?: DocumentAnalysis
}

export interface DocumentAnalysis {
  id: string
  documentId: string
  overallRiskScore: number
  riskLevel: "low" | "medium" | "high"
  clauses: Clause[]
  summary: string
  recommendations: string[]
  analysisTime: number
  createdAt: Date
}

export interface Clause {
  id: string
  text: string
  category: string
  riskScore: number
  riskLevel: "low" | "medium" | "high"
  explanation: string
  plainLanguage: string
  analogy?: string
  recommendations: string[]
  position: {
    start: number
    end: number
  }
}

export interface AnalyticsData {
  totalDocuments: number
  highRiskClauses: number
  averageRiskScore: number
  averageAnalysisTime: number
  riskTrends: Array<{
    date: string
    low: number
    medium: number
    high: number
  }>
  clauseCategories: Array<{
    category: string
    count: number
    riskLevel: "low" | "medium" | "high"
  }>
  documentTypes: Array<{
    type: string
    count: number
    averageRisk: number
  }>
  recentActivity: Array<{
    id: string
    type: "upload" | "analysis" | "review"
    document: string
    timestamp: Date
    riskLevel: "low" | "medium" | "high"
  }>
}
