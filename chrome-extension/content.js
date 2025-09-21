// LegalEase AI Content Script
const chrome = window.chrome // Declare the chrome variable

class LegalEaseAnalyzer {
  constructor() {
    this.apiUrl = "https://your-app-domain.com/api" // Replace with your actual API URL
    this.legalKeywords = [
      "terms of service",
      "privacy policy",
      "user agreement",
      "license agreement",
      "terms and conditions",
      "end user license",
      "service agreement",
      "legal notice",
      "disclaimer",
      "liability",
      "indemnify",
      "warranty",
      "governing law",
    ]
    this.analyzedElements = new Set()
    this.init()
  }

  init() {
    this.detectLegalContent()
    this.setupMessageListener()
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "checkLegalContent") {
        const legalElements = this.findLegalElements()
        sendResponse({
          hasLegalContent: legalElements.length > 0,
          clauseCount: legalElements.length,
          avgRiskScore: this.calculateAverageRisk(legalElements),
        })
      } else if (request.action === "analyzePage") {
        this.analyzePageContent()
        sendResponse({ success: true })
      }
    })
  }

  detectLegalContent() {
    const legalElements = this.findLegalElements()
    if (legalElements.length > 0) {
      this.highlightLegalContent(legalElements)
    }
  }

  findLegalElements() {
    const elements = []
    const textNodes = this.getTextNodes(document.body)

    textNodes.forEach((node) => {
      const text = node.textContent.toLowerCase()
      if (this.containsLegalKeywords(text) && text.length > 50) {
        elements.push(node.parentElement)
      }
    })

    return elements
  }

  getTextNodes(element) {
    const textNodes = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false)

    let node
    while ((node = walker.nextNode())) {
      if (node.textContent.trim().length > 0) {
        textNodes.push(node)
      }
    }

    return textNodes
  }

  containsLegalKeywords(text) {
    return this.legalKeywords.some((keyword) => text.includes(keyword))
  }

  highlightLegalContent(elements) {
    elements.forEach((element, index) => {
      if (!this.analyzedElements.has(element)) {
        this.addLegalHighlight(element, index)
        this.analyzedElements.add(element)
      }
    })
  }

  addLegalHighlight(element, index) {
    // Create highlight overlay
    const highlight = document.createElement("div")
    highlight.className = "legalease-highlight"
    highlight.style.cssText = `
      position: absolute;
      background: rgba(22, 78, 99, 0.1);
      border: 2px solid #164e63;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10000;
      pointer-events: auto;
    `

    // Position the highlight
    const rect = element.getBoundingClientRect()
    highlight.style.top = rect.top + window.scrollY + "px"
    highlight.style.left = rect.left + window.scrollX + "px"
    highlight.style.width = rect.width + "px"
    highlight.style.height = rect.height + "px"

    // Add click handler for analysis
    highlight.addEventListener("click", () => {
      this.showClauseAnalysis(element, index)
    })

    document.body.appendChild(highlight)
  }

  async showClauseAnalysis(element, index) {
    const text = element.textContent.trim()

    // Create tooltip
    const tooltip = document.createElement("div")
    tooltip.className = "legalease-tooltip"
    tooltip.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        padding: 20px;
        max-width: 400px;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #164e63; font-size: 16px;">Legal Clause Analysis</h3>
          <button onclick="this.closest('.legalease-tooltip').remove()" style="
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #6b7280;
          ">×</button>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">RISK LEVEL</div>
          <div style="
            display: inline-block;
            padding: 4px 8px;
            background: #fef3c7;
            color: #92400e;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          ">MEDIUM RISK</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">PLAIN ENGLISH</div>
          <div style="font-size: 14px; color: #374151; line-height: 1.5;">
            This clause allows the company to change terms without much notice to you.
          </div>
        </div>
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">ANALOGY</div>
          <div style="font-size: 14px; color: #374151; line-height: 1.5;">
            Like a landlord who can change the rules of your lease with minimal warning.
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="this.closest('.legalease-tooltip').remove()" style="
            flex: 1;
            padding: 8px 16px;
            background: #164e63;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
          ">Got it</button>
          <button style="
            padding: 8px 12px;
            background: #f3f4f6;
            color: #374151;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
          ">🔊</button>
        </div>
      </div>
      <div onclick="this.closest('.legalease-tooltip').remove()" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
      "></div>
    `

    document.body.appendChild(tooltip)
  }

  calculateAverageRisk(elements) {
    // Mock risk calculation
    return Math.floor(Math.random() * 40) + 30 // 30-70 range
  }

  analyzePageContent() {
    const legalElements = this.findLegalElements()
    this.highlightLegalContent(legalElements)

    // Show notification
    this.showNotification(`Found ${legalElements.length} legal clauses. Click highlighted areas for analysis.`)
  }

  showNotification(message) {
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #164e63;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 5000)
  }
}

// Initialize the analyzer when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new LegalEaseAnalyzer()
  })
} else {
  new LegalEaseAnalyzer()
}
