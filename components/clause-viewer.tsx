"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Volume2, AlertTriangle, Info, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ttsService } from "@/lib/text-to-speech"
import type { Document, Clause } from "@/lib/types"

export function ClauseViewer() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null)
  const [language, setLanguage] = useState("en")
  const [translatedText, setTranslatedText] = useState<string>("")
  const [isTranslating, setIsTranslating] = useState(false)
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
        const completedDocs = documents.filter((doc: Document) => doc.analysisStatus === "completed")
        setDocuments(completedDocs)
        if (completedDocs.length > 0) {
          setSelectedDocument(completedDocs[0])
          if (completedDocs[0].analysisResult?.clauses.length > 0) {
            setSelectedClause(completedDocs[0].analysisResult.clauses[0])
          }
        }
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const translateClause = async (text: string, targetLang: string) => {
    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: targetLang }),
      })

      if (response.ok) {
        const { translatedText } = await response.json()
        setTranslatedText(translatedText)
      } else {
        throw new Error("Translation failed")
      }
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Failed to translate text",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const getRiskColor = (level: string) => {
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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <CheckCircle className="w-4 h-4" />
      case "medium":
        return <Info className="w-4 h-4" />
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const speakText = (text: string) => {
    ttsService.speak(text, { rate: 0.8 })
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Please sign in to view document analysis</p>
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
            <p className="text-lg text-muted-foreground">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No analyzed documents found</p>
            <p className="text-sm text-muted-foreground mt-2">Upload a document to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const clauses = selectedDocument?.analysisResult?.clauses || []

  return (
    <div className="space-y-6">
      {/* Document Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Document</CardTitle>
          <CardDescription>Choose a document to view its clause analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedDocument?.id || ""}
            onValueChange={(value) => {
              const doc = documents.find((d) => d.id === value)
              setSelectedDocument(doc || null)
              if (doc?.analysisResult?.clauses.length) {
                setSelectedClause(doc.analysisResult.clauses[0])
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a document" />
            </SelectTrigger>
            <SelectContent>
              {documents.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.filename} - {doc.analysisResult?.clauses.length || 0} clauses
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Clause List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Document Clauses</CardTitle>
              <CardDescription>Click on any clause to view detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {clauses.map((clause) => (
                    <div
                      key={clause.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedClause?.id === clause.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedClause(clause)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {clause.category}
                        </Badge>
                        <Badge className={getRiskColor(clause.riskLevel)}>
                          {getRiskIcon(clause.riskLevel)}
                          <span className="ml-1">{clause.riskLevel.toUpperCase()}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{clause.text}</p>
                      <div className="mt-2 text-xs text-muted-foreground">Risk Score: {clause.riskScore}/100</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Clause Analysis */}
        <div className="lg:col-span-2">
          {selectedClause ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Clause Analysis</span>
                      <Badge className={getRiskColor(selectedClause.riskLevel)}>
                        {getRiskIcon(selectedClause.riskLevel)}
                        <span className="ml-1">{selectedClause.riskLevel.toUpperCase()} RISK</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription>AI-powered analysis with plain language explanation</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => speakText(selectedClause.plainLanguage)}>
                      <Volume2 className="w-4 h-4 mr-1" />
                      Listen
                    </Button>
                    <Select
                      value={language}
                      onValueChange={(value) => {
                        setLanguage(value)
                        if (value !== "en") {
                          translateClause(selectedClause.plainLanguage, value)
                        }
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="analysis" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="original">Original Text</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Plain Language Summary</h4>
                      {isTranslating && language !== "en" ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Translating...</span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground leading-relaxed">
                          {language !== "en" && translatedText ? translatedText : selectedClause.plainLanguage}
                        </p>
                      )}
                    </div>

                    {selectedClause.analogy && (
                      <div>
                        <h4 className="font-semibold mb-2">Real-World Analogy</h4>
                        <p className="text-muted-foreground leading-relaxed">{selectedClause.analogy}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-primary">{selectedClause.riskScore}</p>
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-primary">{selectedClause.category}</p>
                        <p className="text-sm text-muted-foreground">Category</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="original" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Original Legal Text</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm leading-relaxed">{selectedClause.text}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      {selectedClause.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg mb-2">
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}

                      {selectedClause.riskLevel === "high" && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>⚠️ High Risk:</strong> Consider seeking legal advice before agreeing to this clause.
                            You may want to negotiate for more favorable terms or additional protections.
                          </p>
                        </div>
                      )}
                      {selectedClause.riskLevel === "medium" && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>⚠️ Medium Risk:</strong> Review this clause carefully. While not immediately
                            dangerous, it could impact you under certain circumstances.
                          </p>
                        </div>
                      )}
                      {selectedClause.riskLevel === "low" && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>✅ Low Risk:</strong> This clause is generally standard and poses minimal risk. It's
                            commonly found in similar agreements.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Select a clause from the list to view detailed analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
