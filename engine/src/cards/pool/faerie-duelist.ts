import { defineCard } from "../define.js";

export default defineCard({
  name: "Faerie Duelist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 1,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nWhen this creature enters, target creature an opponent controls gets -2/-0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature an opponent controls gets -2/-0 until end of turn.",
    },
  ],
});
