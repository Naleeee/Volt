/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,ts}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: require("./src/constants/theme").colors,
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
