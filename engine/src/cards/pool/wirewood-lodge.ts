import { defineCard } from "../define.js";

// EDHREC rank 2392.

export default defineCard({
  name: "Wirewood Lodge",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{G}, {T}: Untap target Elf.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{G}", tap: true },
      // "Target Elf": any Elf permanent, not only a creature (Arbor Elf's Forest shape).
      targets: [{ kind: "permanent", filter: { subtype: "Elf" } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{G}, {T}: Untap target Elf.",
    },
  ],
});
