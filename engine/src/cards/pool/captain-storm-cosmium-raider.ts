import { defineCard } from "../define.js";

// EDHREC rank 6063.

const TEXT = "Whenever an artifact you control enters, put a +1/+1 counter on target Pirate you control.";

export default defineCard({
  name: "Captain Storm, Cosmium Raider",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [{ kind: "permanent", filter: { subtype: "Pirate", controlledBy: "you" } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
