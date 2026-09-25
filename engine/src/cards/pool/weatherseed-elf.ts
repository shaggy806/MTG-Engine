import { defineCard } from "../define.js";

export default defineCard({
  name: "Weatherseed Elf",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
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
