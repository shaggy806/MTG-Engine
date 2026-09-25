import { defineCard } from "../define.js";

export default defineCard({
  name: "Crimson Mage",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 1,
  text: "{R}: Target creature you control gains haste until end of turn. (It can attack and {T} this turn.)",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{R}: Target creature you control gains haste until end of turn.",
    },
  ],
});
