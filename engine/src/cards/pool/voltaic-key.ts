import { defineCard } from "../define.js";

export default defineCard({
  name: "Voltaic Key",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}: Untap target artifact.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["artifact"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{1}, {T}: Untap target artifact.",
    },
  ],
});
