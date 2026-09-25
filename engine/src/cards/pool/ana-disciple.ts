import { defineCard } from "../define.js";

export default defineCard({
  name: "Ana Disciple",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{U}, {T}: Target creature gains flying until end of turn.\n{B}, {T}: Target creature gets -2/-0 until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: true },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{U}, {T}: Target creature gains flying until end of turn.",
    },
    {
      cost: { mana: "{B}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{B}, {T}: Target creature gets -2/-0 until end of turn.",
    },
  ],
});
