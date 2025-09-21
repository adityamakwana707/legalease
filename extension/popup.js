class PopupController {
  constructor() {
    this.apiBase = "https://legalease-ai.vercel.app/api"
    this.chrome = window.chrome // Declare the chrome variable
    this.init()
  }

  async init() {
    const content = document.getElementById("content")

    try {
      // Check if user is authenticated
      const isAuthenticated = await this.checkAuth()

      if (!isAuthenticated) {
        this.showAuthSection(content)
        return
      }

      // Get current tab and analyze content
      const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.url || tab.url.startsWith("chrome://")) {
        this.showUnsupportedPage(content)
        return
      }

      // Inject content script and analyze
      await this.analyzeCurrentPage(content, tab)
    } catch (error) {
      console.error("Popup initialization error:", error)
      this.showError(content, "Failed to initialize extension")
    }
  }

  async checkAuth() {
    try {
      const result = await this.chrome.storage.sync.get(["authToken"])
      return !!result.authToken
    } catch (error) {
      return false
    }
  }

  showAuthSection(content) {
    content.innerHTML = `
      <div class="auth-section">
        <p>Sign in to LegalEase AI to analyze legal content on web pages</p>
        <div class="actions">
          <button class="btn btn-primary" id="signInBtn">Sign In</button>
          <button class="btn btn-secondary" id="openWebApp">Open Web App</button>
        </div>
      </div>
    `

    document.getElementById("signInBtn").addEventListener("click", () => {
      this.chrome.tabs.create({ url: "https://legalease-ai.vercel.app" })
    })

    document.getElementById("openWebApp").addEventListener("click", () => {
      this.chrome.tabs.create({ url: "https://legalease-ai.vercel.app" })
    })
  }

  showUnsupportedPage(content) {
    content.innerHTML = `
      <div class="status">
        <p>This page cannot be analyzed. Try visiting a website with legal content.</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" id="openWebApp">Open Web App</button>
      </div>
    `

    document.getElementById("openWebApp").addEventListener("click", () => {
      this.chrome.tabs.create({ url: "https://legalease-ai.vercel.app" })
    })
  }

  async analyzeCurrentPage(content, tab) {
    content.innerHTML = `
      <div class="status analyzing">
        <div class="spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
        Analyzing page content...
      </div>
    `

    try {
      // Inject content script to extract text
      const [result] = await this.chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.extractPageContent,
      })

      const pageContent = result.result

      if (!pageContent || pageContent.length < 100) {
        this.showNoContent(content)
        return
      }

      // Analyze content with API
      const analysis = await this.analyzeContent(pageContent)
      this.showAnalysisResults(content, analysis)
    } catch (error) {
      console.error("Analysis error:", error)
      this.showError(content, "Failed to analyze page content")
    }
  }

  extractPageContent() {
    // Extract text content from the page
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // Skip script and style elements
        const parent = node.parentElement
        if (parent && (parent.tagName === "SCRIPT" || parent.tagName === "STYLE")) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      },
    })

    let text = ""
    let node
    while ((node = walker.nextNode())) {
      text += node.textContent + " "
    }

    return text.trim()
  }

  async analyzeContent(content) {
    const { authToken } = await this.chrome.storage.sync.get(["authToken"])

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

  showAnalysisResults(content, analysis) {
    const highRiskClauses = analysis.clauses.filter((c) => c.riskLevel === "high")
    const mediumRiskClauses = analysis.clauses.filter((c) => c.riskLevel === "medium")

    let statusClass = "safe"
    let statusText = "No concerning legal content found"

    if (highRiskClauses.length > 0) {
      statusClass = "found"
      statusText = `Found ${highRiskClauses.length} high-risk legal clauses`
    } else if (mediumRiskClauses.length > 0) {
      statusClass = "found"
      statusText = `Found ${mediumRiskClauses.length} medium-risk legal clauses`
    }

    content.innerHTML = `
      <div class="status ${statusClass}">
        ${statusText}
      </div>
      
      ${
        analysis.clauses.length > 0
          ? `
        <div class="clauses-found">
          <h3 style="font-size: 14px; margin-bottom: 8px;">Detected Clauses:</h3>
          ${analysis.clauses
            .slice(0, 3)
            .map(
              (clause) => `
            <div class="clause-item ${clause.riskLevel}">
              <strong>${clause.category}</strong><br>
              <small>${clause.plainLanguage}</small>
            </div>
          `,
            )
            .join("")}
          ${analysis.clauses.length > 3 ? `<p style="font-size: 12px; color: #6b7280;">+${analysis.clauses.length - 3} more clauses</p>` : ""}
        </div>
      `
          : ""
      }
      
      <div class="actions">
        <button class="btn btn-primary" id="viewFullAnalysis">View Full Analysis</button>
        <button class="btn btn-secondary" id="highlightClauses">Highlight on Page</button>
      </div>
    `

    document.getElementById("viewFullAnalysis").addEventListener("click", () => {
      this.chrome.tabs.create({ url: "https://legalease-ai.vercel.app/analyze" })
    })

    document.getElementById("highlightClauses").addEventListener("click", async () => {
      const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true })
      this.chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.highlightClauses,
        args: [analysis.clauses],
      })
    })
  }

  highlightClauses(clauses) {
    // Remove existing highlights
    document.querySelectorAll(".legalease-highlight").forEach((el) => {
      el.outerHTML = el.innerHTML
    })

    // Highlight new clauses
    clauses.forEach((clause) => {
      const regex = new RegExp(clause.text.substring(0, 50), "gi")
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)

      let node
      while ((node = walker.nextNode())) {
        if (regex.test(node.textContent)) {
          const parent = node.parentElement
          const highlighted = node.textContent.replace(
            regex,
            (match) =>
              `<span class="legalease-highlight" style="background: ${
                clause.riskLevel === "high" ? "#fef2f2" : clause.riskLevel === "medium" ? "#fffbeb" : "#f0fdf4"
              }; border-bottom: 2px solid ${
                clause.riskLevel === "high" ? "#ef4444" : clause.riskLevel === "medium" ? "#f59e0b" : "#10b981"
              };">${match}</span>`,
          )
          parent.innerHTML = parent.innerHTML.replace(node.textContent, highlighted)
          break
        }
      }
    })
  }

  showNoContent(content) {
    content.innerHTML = `
      <div class="status">
        <p>No analyzable content found on this page.</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" id="openWebApp">Open Web App</button>
      </div>
    `

    document.getElementById("openWebApp").addEventListener("click", () => {
      this.chrome.tabs.create({ url: "https://legalease-ai.vercel.app" })
    })
  }

  showError(content, message) {
    content.innerHTML = `
      <div class="status" style="background: #fef2f2; color: #991b1b;">
        <p>${message}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" id="retry">Retry</button>
        <button class="btn btn-secondary" id="openWebApp">Open Web App</button>
      </div>
    `

    document.getElementById("retry").addEventListener("click", () => {
      this.init()
    })

    document.getElementById("openWebApp").addEventListener("click", () => {
      this.chrome.tabs.create({ url: "https://legalease-ai.vercel.app" })
    })
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupController()
})
