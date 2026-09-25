import { defineCard } from "../define.js";

export default defineCard({
  name: "Ambush Gigapede",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 6,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, target creature an opponent controls gets -2/-2 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature an opponent controls gets -2/-2 until end of turn.",
    },
  ],
});
