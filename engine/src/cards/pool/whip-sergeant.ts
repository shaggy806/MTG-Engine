import { defineCard } from "../define.js";

export default defineCard({
  name: "Whip Sergeant",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  text: "{R}: Target creature gains haste until end of turn. (It can attack this turn.)",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{R}: Target creature gains haste until end of turn.",
    },
  ],
});
