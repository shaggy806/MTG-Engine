import { defineCard } from "../define.js";

export default defineCard({
  name: "Burrog Befuddler",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Frog", "Wizard"],
  power: 2,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nWhen this creature enters, target creature an opponent controls gets -1/-0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature an opponent controls gets -1/-0 until end of turn.",
    },
  ],
});
