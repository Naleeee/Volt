/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,tsx,ts,jsx}", "./components/**/*.{js,tsx,ts,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: require("./constants/theme").colors,
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
