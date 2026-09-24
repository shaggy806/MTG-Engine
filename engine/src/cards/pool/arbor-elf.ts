import { defineCard } from "../define.js";

// Any Forest — a typed dual or a Triome counts, and it needn't be yours.
export default defineCard({
  name: "Arbor Elf",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: "{T}: Untap target Forest.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", filter: { subtype: "Forest" } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{T}: Untap target Forest.",
    },
  ],
});
