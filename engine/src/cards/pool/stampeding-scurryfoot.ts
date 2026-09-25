import { defineCard } from "../define.js";

export default defineCard({
  name: "Stampeding Scurryfoot",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Mouse"],
  power: 1,
  toughness: 1,
  text: "Exhaust — {3}{G}: Put a +1/+1 counter on this creature. Create a 3/3 green Elephant creature token. (Activate each exhaust ability only once.)",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "create-token", token: "Elephant Token", count: 1 },
        ],
      },
      resolve: null,
      text: "Exhaust — {3}{G}: Put a +1/+1 counter on this creature. Create a 3/3 green Elephant creature token.",
      exhaust: true,
    },
  ],
});
