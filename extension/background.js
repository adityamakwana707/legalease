// Background script for LegalEase AI Chrome Extension

const chrome = window.chrome // Declare the chrome variable

class BackgroundService {
  constructor() {
    this.apiBase = "https://legalease-ai.vercel.app/api"
    this.init()
  }

  init() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === "install") {
        this.handleInstall()
      }
    })

    // Listen for auth token updates from web app
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async response
    })

    // Monitor tab updates for legal content detection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.url) {
        this.checkPageForLegalContent(tab)
      }
    })
  }

  handleInstall() {
    // Open welcome page
    chrome.tabs.create({
      url: "https://legalease-ai.vercel.app?source=extension",
    })
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "AUTH_TOKEN":
          await this.storeAuthToken(message.token)
          sendResponse({ success: true })
          break

        case "ANALYZE_CONTENT":
          const result = await this.analyzeContent(message.content)
          sendResponse({ success: true, result })
          break

        case "GET_AUTH_STATUS":
          const isAuthenticated = await this.checkAuthStatus()
          sendResponse({ authenticated: isAuthenticated })
          break

        default:
          sendResponse({ error: "Unknown message type" })
      }
    } catch (error) {
      console.error("Background message error:", error)
      sendResponse({ error: error.message })
    }
  }

  async storeAuthToken(token) {
    await chrome.storage.sync.set({ authToken: token })
    console.log("Auth token stored")
  }

  async checkAuthStatus() {
    try {
      const result = await chrome.storage.sync.get(["authToken"])
      return !!result.authToken
    } catch (error) {
      return false
    }
  }

  async analyzeContent(content) {
    const { authToken } = await chrome.storage.sync.get(["authToken"])

    if (!authToken) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${this.apiBase}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        text: content,
        filename: "web-content.txt",
      }),
    })

    if (!response.ok) {
      throw new Error("Analysis failed")
    }

    return await response.json()
  }

  async checkPageForLegalContent(tab) {
    // Skip non-http pages
    if (!tab.url || !tab.url.startsWith("http")) {
      return
    }

    try {
      // Check if user is authenticated
      const isAuthenticated = await this.checkAuthStatus()
      if (!isAuthenticated) {
        return
      }

      // Inject content script to check for legal keywords
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.detectLegalKeywords,
      })

      if (result.result && result.result.hasLegalContent) {
        // Show badge indicating legal content detected
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: "!",
        })
        chrome.action.setBadgeBackgroundColor({
          tabId: tab.id,
          color: "#f59e0b",
        })
      } else {
        // Clear badge
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: "",
        })
      }
    } catch (error) {
      console.error("Legal content detection error:", error)
    }
  }

  detectLegalKeywords() {
    const legalKeywords = [
      "terms of service",
      "privacy policy",
      "user agreement",
      "license agreement",
      "terms and conditions",
      "end user license",
      "service agreement",
      "liability",
      "indemnify",
      "warranty",
      "disclaimer",
      "governing law",
      "arbitration",
      "jurisdiction",
      "intellectual property",
      "copyright",
      "trademark",
      "confidentiality",
      "non-disclosure",
      "termination",
    ]

    const pageText = document.body.textContent.toLowerCase()
    const foundKeywords = legalKeywords.filter((keyword) => pageText.includes(keyword))

    return {
      hasLegalContent: foundKeywords.length >= 3,
      keywords: foundKeywords,
    }
  }
}

// Initialize background service
new BackgroundService()
