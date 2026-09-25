import { defineCard } from "../define.js";

export default defineCard({
  name: "Beast-Kin Ranger",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Ranger"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)\nWhenever another creature you control enters, this creature gets +1/+0 until end of turn.",
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
