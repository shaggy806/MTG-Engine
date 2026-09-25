import { defineCard } from "../define.js";

export default defineCard({
  name: "Galvanic Key",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  keywords: ["flash"],
  text: "Flash\n{3}, {T}: Untap target artifact.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["artifact"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{3}, {T}: Untap target artifact.",
    },
  ],
});
