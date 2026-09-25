import { defineCard } from "../define.js";

export default defineCard({
  name: "Blossom Dryad",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 2,
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
