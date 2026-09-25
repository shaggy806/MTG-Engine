import { defineCard } from "../define.js";

export default defineCard({
  name: "Jandor's Saddlebags",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: Untap target creature.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{3}, {T}: Untap target creature.",
    },
  ],
});
