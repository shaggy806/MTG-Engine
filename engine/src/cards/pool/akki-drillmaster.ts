import { defineCard } from "../define.js";

export default defineCard({
  name: "Akki Drillmaster",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{T}: Target creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gains haste until end of turn.",
    },
  ],
});
