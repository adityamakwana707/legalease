document.addEventListener("DOMContentLoaded", () => {
  const analyzeBtn = document.getElementById("analyzeBtn")
  const settingsBtn = document.getElementById("settingsBtn")
  const statusDiv = document.getElementById("status")
  const clausesFound = document.getElementById("clausesFound")
  const riskScore = document.getElementById("riskScore")

  // Declare the chrome variable
  const chrome = window.chrome

  // Check current tab for legal content
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "checkLegalContent" }, (response) => {
      if (response && response.hasLegalContent) {
        statusDiv.textContent = `${response.clauseCount} legal clauses detected`
        statusDiv.className = "status active"
        clausesFound.textContent = response.clauseCount
        riskScore.textContent = response.avgRiskScore || "--"
      }
    })
  })

  analyzeBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "analyzePage" }, (response) => {
        if (response && response.success) {
          statusDiv.textContent = "Analysis complete! Check highlighted content."
          statusDiv.className = "status active"
        }
      })
    })
  })

  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage()
  })
})
