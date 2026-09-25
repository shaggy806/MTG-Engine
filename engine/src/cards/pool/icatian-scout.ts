import { defineCard } from "../define.js";

export default defineCard({
  name: "Icatian Scout",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Scout"],
  power: 1,
  toughness: 1,
  text: "{1}, {T}: Target creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{1}, {T}: Target creature gains first strike until end of turn.",
    },
  ],
});
