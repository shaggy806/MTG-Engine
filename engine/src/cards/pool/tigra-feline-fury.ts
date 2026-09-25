import { defineCard } from "../define.js";

export default defineCard({
  name: "Tigra, Feline Fury",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Human", "Hero"],
  power: 2,
  toughness: 1,
  keywords: ["flash", "trample"],
  text: "Flash\nTrample\nWhenever you gain life, put a +1/+1 counter on Tigra.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you gain life, put a +1/+1 counter on Tigra.",
    },
  ],
});
