import { defineCard } from "../define.js";

export default defineCard({
  name: "Advance Scout",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Scout"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\n{W}: Target creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{W}: Target creature gains first strike until end of turn.",
    },
  ],
});
