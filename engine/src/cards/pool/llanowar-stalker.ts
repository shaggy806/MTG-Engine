import { defineCard } from "../define.js";

export default defineCard({
  name: "Llanowar Stalker",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Whenever another creature you control enters, this creature gets +1/+0 until end of turn.",
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
      text: "Whenever another creature you control enters, this creature gets +1/+0 until end of turn.",
    },
  ],
});
