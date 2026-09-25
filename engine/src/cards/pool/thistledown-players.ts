import { defineCard } from "../define.js";

export default defineCard({
  name: "Thistledown Players",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Mouse", "Bard"],
  power: 3,
  toughness: 3,
  text: "Whenever this creature attacks, untap target nonland permanent.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["nonland-permanent"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Whenever this creature attacks, untap target nonland permanent.",
    },
  ],
});
