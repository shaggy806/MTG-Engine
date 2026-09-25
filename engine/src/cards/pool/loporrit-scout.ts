import { defineCard } from "../define.js";

export default defineCard({
  name: "Loporrit Scout",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Rabbit", "Scout"],
  power: 3,
  toughness: 2,
  text: "Whenever another creature you control enters, this creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another creature you control enters, this creature gets +1/+1 until end of turn.",
    },
  ],
});
