import { defineCard } from "../define.js";

export default defineCard({
  name: "Oxidda Daredevil",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Artificer"],
  power: 2,
  toughness: 1,
  text: "Sacrifice an artifact: This creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an artifact: This creature gains haste until end of turn.",
    },
  ],
});
