import { defineCard } from "../define.js";

export default defineCard({
  name: "Shinen of Fury's Fire",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste\nChannel — {R}, Discard this card: Target creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "Channel — {R}, Discard this card: Target creature gains haste until end of turn.",
      zone: "hand",
    },
  ],
});
