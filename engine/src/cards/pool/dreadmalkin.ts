import { defineCard } from "../define.js";

export default defineCard({
  name: "Dreadmalkin",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Cat"],
  power: 1,
  toughness: 1,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\n{2}{B}, Sacrifice another creature or planeswalker: Put two +1/+1 counters on this creature.",
  activated: [
    {
      cost: {
        mana: "{2}{B}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["creature", "planeswalker"] } },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "{2}{B}, Sacrifice another creature or planeswalker: Put two +1/+1 counters on this creature.",
      otherOnly: true,
    },
  ],
});
