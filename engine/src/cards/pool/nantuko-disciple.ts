import { defineCard } from "../define.js";

export default defineCard({
  name: "Nantuko Disciple",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Druid"],
  power: 2,
  toughness: 2,
  text: "{G}, {T}: Target creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{G}, {T}: Target creature gets +2/+2 until end of turn.",
    },
  ],
});
