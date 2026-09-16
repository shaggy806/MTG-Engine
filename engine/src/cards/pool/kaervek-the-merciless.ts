import { defineCard } from "../define.js";

// "Damage equal to that spell's mana value" — `{ manaValueOf: "trigger-object" }`
// reads the spell that fired the trigger, and it reads the *printed* card, so
// it still answers after the spell has resolved or been countered.
export default defineCard({
  name: "Kaervek the Merciless",
  manaCost: "{5}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 5,
  toughness: 4,
  text:
    "Whenever an opponent casts a spell, Kaervek the Merciless deals damage equal " +
    "to that spell's mana value to any target.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { manaValueOf: "trigger-object" }, target: 0 },
      resolve: null,
      text:
        "Whenever an opponent casts a spell, Kaervek the Merciless deals damage equal " +
        "to that spell's mana value to any target.",
    },
  ],
});
