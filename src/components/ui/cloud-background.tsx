import type React from "react"

export const CloudBackground: React.FC = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 200"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c2e0f4" />
          <stop offset="100%" stopColor="#a4cbe6" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#skyGradient)" />

      {/* Background clouds */}
      <g opacity="0.8">
        <ellipse cx="100" cy="150" rx="80" ry="40" fill="#ffffff" />
        <ellipse cx="150" cy="140" rx="70" ry="35" fill="#ffffff" />
        <ellipse cx="200" cy="160" rx="90" ry="45" fill="#ffffff" />

        <ellipse cx="400" cy="170" rx="100" ry="50" fill="#ffffff" />
        <ellipse cx="450" cy="150" rx="80" ry="40" fill="#ffffff" />
        <ellipse cx="500" cy="180" rx="90" ry="45" fill="#ffffff" />

        <ellipse cx="650" cy="160" rx="90" ry="45" fill="#ffffff" />
        <ellipse cx="700" cy="140" rx="70" ry="35" fill="#ffffff" />
        <ellipse cx="750" cy="170" rx="80" ry="40" fill="#ffffff" />
      </g>

      {/* Foreground clouds with more opacity */}
      <g opacity="0.9">
        <ellipse cx="150" cy="180" rx="100" ry="50" fill="#ffffff" />
        <ellipse cx="250" cy="190" rx="120" ry="60" fill="#ffffff" />
        <ellipse cx="350" cy="200" rx="110" ry="55" fill="#ffffff" />

        <ellipse cx="500" cy="210" rx="130" ry="65" fill="#ffffff" />
        <ellipse cx="600" cy="190" rx="100" ry="50" fill="#ffffff" />
        <ellipse cx="700" cy="200" rx="120" ry="60" fill="#ffffff" />
      </g>
    </svg>
  )
}
