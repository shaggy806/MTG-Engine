import { defineCard } from "../define.js";

export default defineCard({
  name: "Consumptive Goo",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Ooze"],
  power: 1,
  toughness: 1,
  text: "{2}{B}{B}: Target creature gets -1/-1 until end of turn. Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{2}{B}{B}", tap: false },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: "{2}{B}{B}: Target creature gets -1/-1 until end of turn. Put a +1/+1 counter on this creature.",
    },
  ],
});
