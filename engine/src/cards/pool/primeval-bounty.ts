import { defineCard } from "../define.js";

export default defineCard({
  name: "Primeval Bounty",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever you cast a creature spell, create a 3/3 green Beast creature token.\nWhenever you cast a noncreature spell, put three +1/+1 counters on target creature you control.\nLandfall — Whenever a land you control enters, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
      resolve: null,
      text: "Whenever you cast a creature spell, create a 3/3 green Beast creature token.",
    },
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, put three +1/+1 counters on target creature you control.",
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you gain 3 life.",
    },
  ],
});
