import { defineCard } from "../define.js";

export default defineCard({
  name: "Zarichi Tiger",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 3,
  text: "{1}{W}, {T}: You gain 2 life.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "{1}{W}, {T}: You gain 2 life.",
    },
  ],
});
