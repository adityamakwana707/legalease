// LegalEase AI Background Script
const chrome = window.chrome // Declare the chrome variable

chrome.runtime.onInstalled.addListener(() => {
  console.log("LegalEase AI Extension installed")

  // Set default settings
  chrome.storage.sync.set({
    autoAnalyze: true,
    language: "en",
    riskThreshold: "medium",
  })
})

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "analyzePage" })
})

// Context menu for analyzing selected text
chrome.contextMenus.create({
  id: "analyzeLegalText",
  title: "Analyze with LegalEase AI",
  contexts: ["selection"],
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeLegalText") {
    chrome.tabs.sendMessage(tab.id, {
      action: "analyzeSelection",
      text: info.selectionText,
    })
  }
})
