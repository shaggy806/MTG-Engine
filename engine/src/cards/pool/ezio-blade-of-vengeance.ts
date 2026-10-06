import { defineCard } from "../define.js";

// EDHREC rank 6449.

export default defineCard({
  name: "Ezio, Blade of Vengeance",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 5,
  toughness: 5,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\nWhenever an Assassin you control deals combat damage to a player, draw a card.",
  // Bident of Thassa's trigger, one per Assassin that connects — Ezio itself included.
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { subtype: "Assassin" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever an Assassin you control deals combat damage to a player, draw a card.",
    },
  ],
});
