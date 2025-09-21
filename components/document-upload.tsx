"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useAuth } from "./auth-provider"
import { useToast } from "@/hooks/use-toast"

interface AnalysisResult {
  id: string
  filename: string
  status: "uploading" | "analyzing" | "completed" | "error"
  progress: number
  clauses: number
  riskScore: number
  riskLevel: "low" | "medium" | "high"
  error?: string
}

export function DocumentUpload() {
  const [files, setFiles] = useState<AnalysisResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upload documents.",
          variant: "destructive",
        })
        return
      }

      setIsProcessing(true)

      for (const file of acceptedFiles) {
        const newFile: AnalysisResult = {
          id: crypto.randomUUID(),
          filename: file.name,
          status: "uploading",
          progress: 0,
          clauses: 0,
          riskScore: 0,
          riskLevel: "low",
        }

        setFiles((prev) => [...prev, newFile])

        try {
          await uploadAndAnalyzeFile(file, newFile.id)
        } catch (error) {
          console.error("Upload failed:", error)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
                : f,
            ),
          )
        }
      }

      setIsProcessing(false)
    },
    [user, toast],
  )

  const uploadAndAnalyzeFile = async (file: File, fileId: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("filename", file.name)

    // Update status to uploading
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploading", progress: 10 } : f)))

    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
      credentials: 'include'
    })

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error || "Upload failed")
    }

    const { documentId } = await response.json()

    // Update status to analyzing
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "analyzing", progress: 30 } : f)))

    // Poll for analysis completion
    await pollAnalysisStatus(documentId, fileId)
  }

  const pollAnalysisStatus = async (documentId: string, fileId: string) => {
    const maxAttempts = 30 // 30 seconds max
    let attempts = 0

    const poll = async () => {
      attempts++

      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error("Failed to get analysis status")
        }

        const { document, analysis } = await response.json()

        if (document.analysisStatus === "completed" && analysis) {
          // Analysis complete
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                    clauses: analysis.clauses.length,
                    riskScore: analysis.overallRiskScore,
                    riskLevel: analysis.riskLevel,
                  }
                : f,
            ),
          )
          return
        } else if (document.analysisStatus === "error") {
          throw new Error("Analysis failed")
        }

        // Still analyzing, update progress
        const progress = Math.min(30 + attempts * 2, 90)
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))

        if (attempts < maxAttempts) {
          setTimeout(poll, 1000) // Poll every second
        } else {
          throw new Error("Analysis timeout")
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Analysis failed",
                }
              : f,
          ),
        )
      }
    }

    poll()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

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

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Legal Documents</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT files for AI-powered analysis. Maximum file size: 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-primary">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground">PDF, DOCX, and TXT files up to 10MB</p>
              </div>
            )}
            <Button className="mt-4" disabled={isProcessing || !user}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {user ? "Select Files" : "Sign In to Upload"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>AI-powered analysis results for your uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{file.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.status === "completed" && `${file.clauses} clauses identified`}
                          {file.status === "error" && file.error}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(file.status === "uploading" || file.status === "analyzing") && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {file.status === "completed" && (
                        <>
                          <Badge className={getRiskColor(file.riskLevel)}>{file.riskLevel.toUpperCase()} RISK</Badge>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </>
                      )}
                      {file.status === "error" && <AlertCircle className="w-4 h-4 text-red-600" />}
                    </div>
                  </div>

                  {(file.status === "uploading" || file.status === "analyzing") && (
                    <div className="space-y-2">
                      <Progress value={file.progress} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {file.status === "uploading" ? "Uploading..." : "Analyzing with Gemini AI..."} {file.progress}%
                      </p>
                    </div>
                  )}

                  {file.status === "completed" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{file.clauses}</p>
                        <p className="text-sm text-muted-foreground">Clauses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{file.riskScore}</p>
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                      </div>
                      <div className="text-center">
                        <Badge className={getRiskColor(file.riskLevel)} variant="outline">
                          {file.riskLevel.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">Risk Level</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
