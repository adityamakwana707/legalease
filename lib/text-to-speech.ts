class TextToSpeechService {
  private synth: SpeechSynthesis | null = null

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis
    }
  }

  speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) {
    if (!this.synth) {
      console.warn("Speech synthesis not supported")
      return
    }

    // Cancel any ongoing speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate || 0.8
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1

    this.synth.speak(utterance)
  }

  stop() {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  getVoices() {
    if (!this.synth) return []
    return this.synth.getVoices()
  }
}

export const ttsService = new TextToSpeechService()
