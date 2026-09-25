import { defineCard } from "../define.js";

export default defineCard({
  name: "Black Dragon",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nAcid Breath — When this creature enters, target creature an opponent controls gets -3/-3 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
      resolve: null,
      text: "Acid Breath — When this creature enters, target creature an opponent controls gets -3/-3 until end of turn.",
    },
  ],
});
