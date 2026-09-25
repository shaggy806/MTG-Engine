import { defineCard } from "../define.js";

export default defineCard({
  name: "Shinen of Flight's Wings",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nChannel — {U}, Discard this card: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Channel — {U}, Discard this card: Target creature gains flying until end of turn.",
      zone: "hand",
    },
  ],
});
