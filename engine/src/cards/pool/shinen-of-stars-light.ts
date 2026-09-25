import { defineCard } from "../define.js";

export default defineCard({
  name: "Shinen of Stars' Light",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\nChannel — {1}{W}, Discard this card: Target creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "Channel — {1}{W}, Discard this card: Target creature gains first strike until end of turn.",
      zone: "hand",
    },
  ],
});
