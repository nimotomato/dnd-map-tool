import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bookinsanity: ["Bookinsanity", "arial"],
        mrEaves: ["MrEaves", "arial"],
        quentincaps: ["Quentincaps", "arial"],
      },
    },
  },
  plugins: [],
} satisfies Config;
