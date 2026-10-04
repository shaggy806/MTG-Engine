import { defineCard } from "../define.js";

// EDHREC rank 3270.

const SYMPHONY_TEXT =
  "Symphony of Pain — Whenever you cast a spell from anywhere other than your hand, this creature deals damage equal to that spell's mana value to target opponent.";

export default defineCard({
  name: "Keeper of Secrets",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 4,
  keywords: ["first-strike", "haste"],
  text: `First strike, haste\n${SYMPHONY_TEXT}`,
  triggered: [
    {
      // Flaming Tyrannosaurus's paradox trigger; the amount is Kaervek the
      // Merciless's "that spell's mana value".
      trigger: { on: "cast-spell", who: "you", notFrom: "hand" },
      targets: ["opponent"],
      effect: { kind: "damage", amount: { manaValueOf: "trigger-object" }, target: 0 },
      resolve: null,
      text: SYMPHONY_TEXT,
    },
  ],
});
