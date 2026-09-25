import { defineCard } from "../define.js";

export default defineCard({
  name: "Hulk, Brutal Brawler",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gamma", "Berserker", "Hero"],
  power: 4,
  toughness: 4,
  text: "Hulk attacks each combat if able.\nWhenever Hulk attacks, put a +1/+1 counter on each other creature you control.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: "Whenever Hulk attacks, put a +1/+1 counter on each other creature you control.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "Hulk attacks each combat if able.",
    },
  ],
});
