import { defineCard } from "../define.js";

export default defineCard({
  name: "Insatiable Souleater",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Beast"],
  power: 5,
  toughness: 1,
  text: "{G/P}: This creature gains trample until end of turn. ({G/P} can be paid with either {G} or 2 life.)",
  activated: [
    {
      cost: { mana: "{G/P}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{G/P}: This creature gains trample until end of turn.",
    },
  ],
});
