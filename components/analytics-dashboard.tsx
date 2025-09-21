"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { AlertTriangle, FileText, Shield, Clock, Loader2 } from "lucide-react"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { AnalyticsData } from "@/lib/types"

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        throw new Error("Failed to load analytics")
      }
    } catch (error) {
      console.error("Analytics error:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Please sign in to view analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics || analytics.totalDocuments === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No analytics data available</p>
            <p className="text-sm text-muted-foreground mt-2">Upload and analyze documents to see insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const clauseCategoryData = analytics.clauseCategories.map((category, index) => ({
    name: category.category,
    value: category.count,
    color: category.riskLevel === "high" ? "#ef4444" : category.riskLevel === "medium" ? "#f59e0b" : "#10b981",
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Analyzed documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Clauses</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.highRiskClauses}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRiskScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.averageAnalysisTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Average per document</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Trends Over Time</CardTitle>
            <CardDescription>Daily breakdown of risk levels in analyzed documents</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.riskTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Risk" />
                <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium Risk" />
                <Bar dataKey="low" stackId="a" fill="#10b981" name="Low Risk" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Clause Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Clause Categories</CardTitle>
            <CardDescription>Distribution of clauses by category</CardDescription>
          </CardHeader>
          <CardContent>
            {clauseCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clauseCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clauseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No clause data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Types Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Document Type Analysis</CardTitle>
          <CardDescription>Risk analysis breakdown by document type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.documentTypes.length > 0 ? (
              analytics.documentTypes.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{doc.type.toUpperCase()} Files</p>
                      <p className="text-sm text-muted-foreground">{doc.count} documents analyzed</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Avg Risk: {doc.averageRisk}/100</p>
                      <Progress value={doc.averageRisk} className="w-24" />
                    </div>
                    <Badge
                      className={
                        doc.averageRisk < 40
                          ? "bg-green-100 text-green-800 border-green-200"
                          : doc.averageRisk < 70
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }
                    >
                      {doc.averageRisk < 40 ? "LOW" : doc.averageRisk < 70 ? "MEDIUM" : "HIGH"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No document type data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analysis Activity</CardTitle>
          <CardDescription>Latest document analyses and risk assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{activity.document}</p>
                      <p className="text-sm text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">{activity.type}</span>
                    <Badge
                      className={
                        activity.riskLevel === "low"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : activity.riskLevel === "medium"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }
                    >
                      {activity.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
