import { defineCard } from "../define.js";

export default defineCard({
  name: "Mirran Spy",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drone"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast an artifact spell, you may untap target creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: ["creature"],
      effect: { kind: "may", prompt: "Untap target creature?", effect: { kind: "untap", target: 0 } },
      resolve: null,
      text: "Whenever you cast an artifact spell, you may untap target creature.",
    },
  ],
});
