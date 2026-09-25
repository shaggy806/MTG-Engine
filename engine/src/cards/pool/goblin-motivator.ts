import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Motivator",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: "{T}: Target creature gains haste until end of turn. (It can attack and {T} this turn.)",
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
