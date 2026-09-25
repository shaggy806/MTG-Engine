import { defineCard } from "../define.js";

export default defineCard({
  name: "Pyre Hound",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 2,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nWhenever you cast an instant or sorcery spell, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, put a +1/+1 counter on this creature.",
    },
  ],
});
