import { defineCard } from "../define.js";

const TEXT =
  "Whenever you cast an instant or sorcery spell, put a +1/+1 counter on this creature. Then this creature deals damage equal to its power to target opponent.";

export default defineCard({
  name: "Caldera Pyremaw",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "damage", amount: { powerOf: "source" }, target: 0 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
