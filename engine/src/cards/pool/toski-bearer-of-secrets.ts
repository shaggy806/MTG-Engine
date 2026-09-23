import { defineCard } from "../define.js";

// - "This spell can't be countered." — `cantBeCountered`.
// - "Toski attacks each combat if able." — a `must-attack` self restriction
//   (Juggernaut's shape). Left undeclared, it's added to the attack; declared,
//   it goes where its controller sent it.
// - "Whenever a creature you control deals combat damage to a player" — the
//   combat-damage trigger scoped by `who: "you-control"` to whichever of your
//   creatures dealt it, so each one that connects draws separately.
const DAMAGE_TEXT = "Whenever a creature you control deals combat damage to a player, draw a card.";

export default defineCard({
  name: "Toski, Bearer of Secrets",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Squirrel"],
  power: 1,
  toughness: 1,
  keywords: ["indestructible"],
  cantBeCountered: true,
  text:
    "This spell can't be countered.\n" +
    "Indestructible\n" +
    "Toski attacks each combat if able.\n" +
    DAMAGE_TEXT,
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "Toski attacks each combat if able.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { type: "creature" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
