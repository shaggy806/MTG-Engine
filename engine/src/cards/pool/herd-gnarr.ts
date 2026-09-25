import { defineCard } from "../define.js";

export default defineCard({
  name: "Herd Gnarr",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 2,
  text: "Whenever another creature you control enters, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another creature you control enters, this creature gets +2/+2 until end of turn.",
    },
  ],
});
