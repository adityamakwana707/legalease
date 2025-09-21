"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Search, Download, Trash2, Eye, Calendar } from "lucide-react"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { Document } from "@/lib/types"

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  const loadDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const { documents } = await response.json()
        setDocuments(documents)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        toast({
          title: "Document Deleted",
          description: "Document has been successfully deleted",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const filteredDocuments = documents.filter((doc) => doc.filename.toLowerCase().includes(searchTerm.toLowerCase()))

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "analyzing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Please sign in to view your documents</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>Manage and view all your analyzed legal documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-medium">{document.filename}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(document.analysisStatus)}>
                        {document.analysisStatus.toUpperCase()}
                      </Badge>
                      {document.analysisResult && (
                        <Badge className={getRiskColor(document.analysisResult.riskLevel)}>
                          {document.analysisResult.riskLevel.toUpperCase()} RISK
                        </Badge>
                      )}
                    </div>
                  </div>

                  {document.analysisResult && (
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{document.analysisResult.clauses.length}</p>
                        <p className="text-muted-foreground">Clauses</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{document.analysisResult.overallRiskScore}</p>
                        <p className="text-muted-foreground">Risk Score</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          {document.analysisResult.clauses.filter((c) => c.riskLevel === "high").length}
                        </p>
                        <p className="text-muted-foreground">High Risk</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Analysis
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocument(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {filteredDocuments.length === 0 && !loading && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {searchTerm ? "No documents match your search" : "No documents found"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Upload your first legal document to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
