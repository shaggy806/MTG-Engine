import { defineCard } from "../define.js";

export default defineCard({
  name: "Ivy Dancer",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad", "Shaman"],
  power: 1,
  toughness: 2,
  text: "{T}: Target creature gains forestwalk until end of turn. (It can't be blocked as long as defending player controls a Forest.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "forestwalk", duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gains forestwalk until end of turn.",
    },
  ],
});
