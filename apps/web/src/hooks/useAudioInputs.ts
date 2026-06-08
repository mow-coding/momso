import { useCallback, useEffect, useMemo, useState } from 'react'

export interface AudioInputDevice {
  deviceId: string
  label: string
}

export function useAudioInputs() {
  const [devices, setDevices] = useState<AudioInputDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supported = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices !== 'undefined' &&
      typeof navigator.mediaDevices.enumerateDevices === 'function',
    [],
  )

  const refreshDevices = useCallback(async (requestPermission = false) => {
    if (!supported) {
      setDevices([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (requestPermission && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      }

      const mediaDevices = await navigator.mediaDevices.enumerateDevices()
      setDevices(
        mediaDevices
          .filter((device) => device.kind === 'audioinput')
          .map((device, index) => ({
            deviceId: device.deviceId || `default-${index}`,
            label: device.label || `Microphone ${index + 1}`,
          })),
      )
    } catch (deviceError) {
      setError(
        deviceError instanceof Error
          ? deviceError.message
          : 'Failed to enumerate audio input devices.',
      )
    } finally {
      setLoading(false)
    }
  }, [supported])

  useEffect(() => {
    if (!supported) {
      return undefined
    }

    void refreshDevices(false)
    const handler = () => {
      void refreshDevices(false)
    }

    navigator.mediaDevices.addEventListener?.('devicechange', handler)

    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', handler)
    }
  }, [refreshDevices, supported])

  return {
    devices,
    loading,
    error,
    supported,
    refreshDevices,
  }
}
