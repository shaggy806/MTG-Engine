import { defineCard } from "../define.js";

export default defineCard({
  name: "Ley Druid",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
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
