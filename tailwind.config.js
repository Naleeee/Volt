/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,tsx,ts,jsx}", "./components/**/*.{js,tsx,ts,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#C8F63F",
        bg: "#0B0C0F",
        card: "#17191F",
        card2: "#1F222B",
        muted: "#8C92A0",
      },
      fontFamily: {
        archivo: ["Archivo-Regular"],
        "archivo-medium": ["Archivo-Medium"],
        "archivo-semibold": ["Archivo-SemiBold"],
        "archivo-bold": ["Archivo-Bold"],
        "archivo-black": ["Archivo-Black"],
      },
    },
  },
  plugins: [],
};
