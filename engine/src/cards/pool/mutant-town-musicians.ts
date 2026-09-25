import { defineCard } from "../define.js";

export default defineCard({
  name: "Mutant Town Musicians",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Mutant", "Bard", "Performer"],
  power: 2,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nAlliance — Whenever another creature you control enters, this creature gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Alliance — Whenever another creature you control enters, this creature gets +1/+0 until end of turn.",
    },
  ],
});
