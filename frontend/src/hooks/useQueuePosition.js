import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useQueuePosition — connects to the SSE endpoint and streams live queue position
 *
 * @param {string} doctorId  - ID of the doctor
 * @param {string} bookingId - ID of the booking to track
 * @returns {{ position, patientsAhead, total, connected, done }}
 */
export function useQueuePosition(doctorId, bookingId) {
  const [state, setState] = useState({
    position: null,
    patientsAhead: null,
    total: null,
    connected: false,
    done: false,
  })
  const esRef = useRef(null)

  const connect = useCallback(() => {
    if (!doctorId || !bookingId) return
    if (esRef.current) esRef.current.close()

    const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api'
    const url = `${apiBase}/sse/queue/${doctorId}/${bookingId}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setState(s => ({ ...s, connected: true }))

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setState(s => ({
          ...s,
          position: data.position,
          patientsAhead: data.patientsAhead,
          total: data.total,
          done: data.done ?? false,
          connected: true,
        }))
        if (data.done) es.close()
      } catch { /* ignore parse errors */ }
    }

    es.onerror = () => {
      setState(s => ({ ...s, connected: false }))
      es.close()
    }
  }, [doctorId, bookingId])

  useEffect(() => {
    connect()
    return () => esRef.current?.close()
  }, [connect])

  return state
}
