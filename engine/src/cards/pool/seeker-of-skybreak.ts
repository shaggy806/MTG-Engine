import { defineCard } from "../define.js";

export default defineCard({
  name: "Seeker of Skybreak",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 2,
  toughness: 1,
  text: "{T}: Untap target creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{T}: Untap target creature.",
    },
  ],
});
