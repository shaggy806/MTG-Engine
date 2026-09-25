import { defineCard } from "../define.js";

export default defineCard({
  name: "Glimmer Bairn",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ouphe"],
  power: 1,
  toughness: 2,
  text: "Sacrifice a token: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { token: true } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a token: This creature gets +2/+2 until end of turn.",
    },
  ],
});
