import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fp: "#f97316",
        jpp: "#dc2626",
      },
    },
  },
}

export default config
