import { defineCard } from "../define.js";

export default defineCard({
  name: "Aron, Benalia's Ruin",
  manaCost: "{W}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Human"],
  power: 3,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\n{W}{B}, {T}, Sacrifice another creature: Put a +1/+1 counter on each creature you control.",
  activated: [
    {
      cost: { mana: "{W}{B}", tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "{W}{B}, {T}, Sacrifice another creature: Put a +1/+1 counter on each creature you control.",
      otherOnly: true,
    },
  ],
});
