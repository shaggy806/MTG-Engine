import { defineCard } from "../define.js";

export default defineCard({
  name: "Locthwain Scorn",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text:
    "Target creature gets -3/-3 until end of turn. You gain 2 life. (Then exile this card. You may cast the enchantment later from exile.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
      { kind: "gain-life", amount: 2 },
    ],
  },
  faces: ["Virtue of Persistence", "Locthwain Scorn"],
  adventure: true,
});
