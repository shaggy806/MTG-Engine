import { defineCard } from "../define.js";

// #385 in top-commanders.txt.
//
// "Another target player" is any player but the caster (the trigger player);
// "that spell's mana value" is read off the spell, as it last existed on the
// stack if it has left.
const LIFE_TEXT = "Your opponents can't gain life.";
const CAST_TEXT =
  "Whenever a player casts their first spell each turn, choose another target player. The Lord of " +
  "Pain deals damage equal to that spell's mana value to the chosen player.";

export default defineCard({
  name: "The Lord of Pain",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 5,
  toughness: 5,
  keywords: ["menace"],
  text: `Menace\n${LIFE_TEXT}\n${CAST_TEXT}`,
  static: [
    { affects: { scope: "self" }, replacement: { event: "would-gain-life", who: "opponent", prevent: true }, text: LIFE_TEXT },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", firstEachTurn: true },
      targets: [{ kind: "other", of: "player", than: "trigger-player" }],
      effect: { kind: "damage", amount: { manaValueOf: "trigger-object" }, target: 0 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
