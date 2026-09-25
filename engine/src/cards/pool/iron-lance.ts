import { defineCard } from "../define.js";

export default defineCard({
  name: "Iron Lance",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: Target creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{3}, {T}: Target creature gains first strike until end of turn.",
    },
  ],
});
