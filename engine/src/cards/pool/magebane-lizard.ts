import { defineCard } from "../define.js";

// EDHREC rank 5343.
//
// Rulings:
//   [2024-04-12] Noncreature spells that were cast before Magebane Lizard entered the battlefield
//     count. If Magebane Lizard enters the battlefield after a player has already cast a
//     noncreature spell in the same turn, that spell will be counted by Magebane Lizard’s
//     triggered ability if that player casts another noncreature spell that turn.
//   [2024-04-12] Magebane Lizard’s ability resolves before the spell that caused it to trigger. It
//     resolves even if that spell is countered.

const TEXT =
  "Whenever a player casts a noncreature spell, this creature deals damage to that player equal to the number of noncreature spells they've cast this turn.";

export default defineCard({
  name: "Magebane Lizard",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 1,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", noncreatureOnly: true },
      targets: [],
      // "That player" is the caster. The count is read as the ability
      // resolves, each spell as it was cast — the triggering one included,
      // and any cast before this creature entered (the ruling).
      effect: {
        kind: "damage",
        amount: { castThisTurn: { notTypes: ["creature"] }, who: "trigger-controller" },
        who: "trigger-controller",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
