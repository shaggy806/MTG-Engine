import { defineCard } from "../define.js";

export default defineCard({
  name: "Gnathosaur",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 5,
  toughness: 4,
  text: "Sacrifice an artifact: This creature gains trample until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an artifact: This creature gains trample until end of turn.",
    },
  ],
});
