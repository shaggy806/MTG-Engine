import { defineCard } from "../define.js";

export default defineCard({
  name: "Pyroceratops",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dinosaur"],
  power: 2,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nWhenever you cast a noncreature spell, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, put a +1/+1 counter on this creature.",
    },
  ],
});
