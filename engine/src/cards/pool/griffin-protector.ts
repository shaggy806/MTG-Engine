import { defineCard } from "../define.js";

export default defineCard({
  name: "Griffin Protector",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever another creature you control enters, this creature gets +1/+1 until end of turn.",
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
