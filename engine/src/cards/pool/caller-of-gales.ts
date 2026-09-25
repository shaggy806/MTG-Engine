import { defineCard } from "../define.js";

export default defineCard({
  name: "Caller of Gales",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{1}{U}, {T}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{U}, {T}: Target creature gains flying until end of turn.",
    },
  ],
});
