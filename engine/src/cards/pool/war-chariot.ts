import { defineCard } from "../define.js";

export default defineCard({
  name: "War Chariot",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: Target creature gains trample until end of turn.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{3}, {T}: Target creature gains trample until end of turn.",
    },
  ],
});
