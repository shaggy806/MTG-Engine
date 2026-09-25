import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Herder",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: "{G}: Target creature gains trample until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{G}: Target creature gains trample until end of turn.",
    },
  ],
});
