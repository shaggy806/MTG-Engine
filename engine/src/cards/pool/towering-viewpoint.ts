import { defineCard } from "../define.js";

export default defineCard({
  name: "Towering Viewpoint",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender", "reach"],
  text: "Defender, reach\nLeap of Faith — {3}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Leap of Faith — {3}: Target creature gains flying until end of turn.",
    },
  ],
});
