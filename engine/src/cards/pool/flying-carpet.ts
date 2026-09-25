import { defineCard } from "../define.js";

export default defineCard({
  name: "Flying Carpet",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{2}, {T}: Target creature gains flying until end of turn.",
    },
  ],
});
