"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Shield, BarChart3, Globe, Volume2, Chrome, Zap, User, LogOut } from "lucide-react"
import { DocumentUpload } from "@/components/document-upload"
import { ClauseViewer } from "@/components/clause-viewer"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { DocumentLibrary } from "@/components/document-library"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AuthModal } from "@/components/auth-modal"

function MainContent() {
  const [activeTab, setActiveTab] = useState("upload")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">LegalEase AI</h1>
                <p className="text-sm text-muted-foreground">Simplify Legal Documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="hidden sm:flex">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)} disabled={loading}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">
              Transform Complex Legal Documents into Plain English
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto">
              Upload contracts, terms of service, or any legal document. Get AI-powered clause analysis, risk scoring,
              and plain-language explanations in seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>PDF & DOCX Support</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span>Multi-language</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Volume2 className="w-4 h-4" />
                <span>Text-to-Speech</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Chrome className="w-4 h-4" />
                <span>Chrome Extension</span>
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload & Analyze</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Document Library</span>
                <span className="sm:hidden">Library</span>
              </TabsTrigger>
              <TabsTrigger value="viewer" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Clause Viewer</span>
                <span className="sm:hidden">Viewer</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <DocumentUpload />
            </TabsContent>

            <TabsContent value="library" className="space-y-6">
              <DocumentLibrary />
            </TabsContent>

            <TabsContent value="viewer" className="space-y-6">
              <ClauseViewer />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Risk Assessment</span>
                </CardTitle>
                <CardDescription>AI-powered risk scoring for every clause with color-coded indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Low Risk</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>
                  <Badge className="bg-red-100 text-red-800 border-red-200">High Risk</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Multi-language Support</span>
                </CardTitle>
                <CardDescription>
                  Get explanations in your preferred language with accurate translations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Chrome className="w-5 h-5 text-primary" />
                  <span>Chrome Extension</span>
                </CardTitle>
                <CardDescription>Analyze legal content on any website with our browser extension</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Chrome className="w-4 h-4 mr-2" />
                  Install Extension
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 LegalEase AI. Powered by Google Cloud & Gemini AI.</p>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}
