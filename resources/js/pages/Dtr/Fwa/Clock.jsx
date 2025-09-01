import { useState, useEffect } from "react"

const Clock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourDegrees = (hours % 12 + minutes / 60) * 30
  const minuteDegrees = (minutes + seconds / 60) * 6
  const secondDegrees = seconds * 6

  return (
    <div className="relative w-96 h-96">
      {/* NEDA Logo as Clock Background */}
      <img
        src="/images/logo.png"
        alt="Neda Logo"
        className="absolute top-1/2 left-1/2 w-[80%] h-[80%] rounded-full object-cover opacity-30 transform -translate-x-1/2 -translate-y-1/2"
      />

      {/* Clock overlay */}
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 100 100"
      >
        {/* Clock numbers */}
        {[...Array(12)].map((_, i) => {
          const angle = ((i + 1) * 30 * Math.PI) / 180
          const x = 50 + 44 * Math.sin(angle) // Adjusted radius for larger clock
          const y = 50 - 44 * Math.cos(angle) // Adjusted radius for larger clock
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="5" // Adjust font size
              fill="black"
              className="font-bold"
            >
              {i + 1}
            </text>
          )
        })}

        {/* Hour hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="30"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${hourDegrees}, 50, 50)`}
        />

        {/* Minute hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${minuteDegrees}, 50, 50)`}
        />

        {/* Second hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="red"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondDegrees}, 50, 50)`}
        />

        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="black" />
      </svg>
    </div>
  )
}

export default Clock
