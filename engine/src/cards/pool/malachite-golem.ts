import { defineCard } from "../define.js";

export default defineCard({
  name: "Malachite Golem",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 5,
  toughness: 3,
  text: "{1}{G}: This creature gains trample until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}: This creature gains trample until end of turn.",
    },
  ],
});
