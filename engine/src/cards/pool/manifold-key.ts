import { defineCard } from "../define.js";

export default defineCard({
  name: "Manifold Key",
  manaCost: "{1}",
  types: ["artifact"],
  text: "{1}, {T}: Untap another target artifact.\n{3}, {T}: Target creature can't be blocked this turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["artifact"],
      otherOnly: true,
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{1}, {T}: Untap another target artifact.",
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: "{3}, {T}: Target creature can't be blocked this turn.",
    },
  ],
});
