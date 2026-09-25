import { defineCard } from "../define.js";

export default defineCard({
  name: "Unseen Walker",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 1,
  toughness: 1,
  keywords: ["forestwalk"],
  text: "Forestwalk (This creature can't be blocked as long as defending player controls a Forest.)\n{1}{G}{G}: Target creature gains forestwalk until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{G}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "forestwalk", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}{G}: Target creature gains forestwalk until end of turn.",
    },
  ],
});
