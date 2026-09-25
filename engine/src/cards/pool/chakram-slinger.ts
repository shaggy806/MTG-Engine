import { defineCard } from "../define.js";

export default defineCard({
  name: "Chakram Slinger",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 4,
  pairing: { kind: "partner-with", name: "Chakram Retriever" },
  text: "Partner with Chakram Retriever (When this creature enters, target player may put Chakram Retriever into their hand from their library, then shuffle.)\n{R}, {T}: This creature deals 2 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: "{R}", tap: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{R}, {T}: This creature deals 2 damage to target player or planeswalker.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Chakram Retriever" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Chakram Retriever, reveal it, put it into their hand, then shuffle.",
    },
  ],
});
