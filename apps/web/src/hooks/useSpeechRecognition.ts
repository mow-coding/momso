import { useEffect, useMemo, useRef, useState } from 'react'

export function useSpeechRecognition(language = 'en-US') {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const supported = useMemo(
    () =>
      typeof window !== 'undefined' &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    [],
  )

  useEffect(() => {
    if (!supported) {
      return undefined
    }

    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!Constructor) {
      return undefined
    }

    const recognition = new Constructor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognition.onerror = (event: Event) => {
      const nextError =
        (event as Event & { error?: string }).error ?? 'Speech recognition failed.'
      setError(nextError)
      setIsListening(false)
    }

    recognition.onresult = (event) => {
      let nextFinal = ''
      let nextInterim = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript ?? ''

        if (result.isFinal) {
          nextFinal += `${transcript} `
        } else {
          nextInterim += transcript
        }
      }

      if (nextFinal.trim()) {
        setFinalTranscript((current) =>
          `${current} ${nextFinal}`.trim().replace(/\s+/g, ' '),
        )
      }

      setInterimTranscript(nextInterim)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [language, supported])

  function start() {
    if (!recognitionRef.current || isListening) {
      return
    }

    recognitionRef.current.start()
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  function reset() {
    setFinalTranscript('')
    setInterimTranscript('')
    setError(null)
  }

  return {
    supported,
    isListening,
    finalTranscript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  }
}
