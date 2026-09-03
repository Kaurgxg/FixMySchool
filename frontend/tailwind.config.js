/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void:          "#040508",
        "wood-black":  "#0F0702",
        "wood-dark":   "#1C0D04",
        "wood-mid":    "#3D1F08",
        "wood-warm":   "#7B4A1E",
        gold:          "#C8960C",
        "gold-light":  "#E8B830",
        parchment:     "#F2E5C4",
        "parchment-d": "#E8D5A8",
        oat:           "#F8F0DC",
        ink:           "#1C0D04",
        mist:          "#9B7A40",
        border:        "#C8A060",
        lime:          "#CAFF4D",
        amber:         "#F5A623",
        teal:          "#22C49A",
        brick:         "#E05252",
        blue:          "#4A7EE8",
      },
      fontFamily: {
        display: ["'DM Sans'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'DM Mono'", "'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "14px",
        pill: "999px",
      },
      boxShadow: {
        card:  "0 1px 0 rgba(28,13,4,.06), 0 6px 20px -4px rgba(28,13,4,.12)",
        gold:  "0 0 0 3px rgba(200,150,12,.3)",
      },
    },
  },
  plugins: [],
};
