import React, { useEffect, useRef, useState } from "react"

type CountdownProps = {
  deadline: Date
}

const secondLabel = "s"
const minuteLabel = "m"
const hourLabel = "h"
const dayLabel = "d"

export const Countdown = ({ deadline }: CountdownProps) => {
  const [formattedRemaining, setFormattedRemaining] = useState("")
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const refreshCountdown = () => {
      const now = new Date()

      if (deadline.getTime() >= now.getTime()) {
        setFormattedRemaining(diffAndFormat(deadline, now))
        timeoutRef.current = setTimeout(refreshCountdown, 1000)
      } else {
        setFormattedRemaining("")
      }
    }
    refreshCountdown()

    return () => clearTimeout(timeoutRef.current)
  }, [deadline])

  return <>{formattedRemaining}</>
}

const timeToDisplayText = (time: number, label: string, displayAlsoZero: boolean) => {
  if (time === 0 && !displayAlsoZero) {
    return ""
  }

  return `${time}${label}`
}

const diffAndFormat = (a: Date, b: Date) => {
  const ms = a.getTime() - b.getTime()
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  const resultParts = [
    [d, dayLabel, false],
    [h % 24, hourLabel, d > 0],
    [m % 60, minuteLabel, h > 0],
    [s % 60, secondLabel, m > 0],
  ] as const

  const formattedResult = resultParts
    .map(([time, label, displayAlsoZero]) => timeToDisplayText(time, label, displayAlsoZero))
    .join(" ")
    .trim()

  return formattedResult !== "" ? formattedResult : `0${secondLabel}`
}
