import { defineCard } from "../define.js";

export default defineCard({
  name: "Bant Battlemage",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "{G}, {T}: Target creature gains trample until end of turn.\n{U}, {T}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: "{G}, {T}: Target creature gains trample until end of turn.",
    },
    {
      cost: { mana: "{U}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{U}, {T}: Target creature gains flying until end of turn.",
    },
  ],
});
