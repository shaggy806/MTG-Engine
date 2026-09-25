import { defineCard } from "../define.js";

export default defineCard({
  name: "Voyaging Satyr",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr", "Druid"],
  power: 1,
  toughness: 2,
  text: "{T}: Untap target land.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["land"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{T}: Untap target land.",
    },
  ],
});
