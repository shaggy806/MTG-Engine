import { defineCard } from "../define.js";

export default defineCard({
  name: "Bronzebeak Moa",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  text: "Whenever another creature you control enters, this creature gets +3/+3 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another creature you control enters, this creature gets +3/+3 until end of turn.",
    },
  ],
});
