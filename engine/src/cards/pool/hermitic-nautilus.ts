import { defineCard } from "../define.js";

export default defineCard({
  name: "Hermitic Nautilus",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Nautilus"],
  power: 1,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\n{1}{U}: This creature gets +3/-3 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: -3, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{U}: This creature gets +3/-3 until end of turn.",
    },
  ],
});
