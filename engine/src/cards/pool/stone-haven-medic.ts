import { defineCard } from "../define.js";

export default defineCard({
  name: "Stone Haven Medic",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Cleric"],
  power: 1,
  toughness: 3,
  text: "{W}, {T}: You gain 1 life.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{W}, {T}: You gain 1 life.",
    },
  ],
});
