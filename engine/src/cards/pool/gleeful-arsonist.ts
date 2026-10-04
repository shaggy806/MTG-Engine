import { defineCard } from "../define.js";
import { undying } from "../helpers.js";

// EDHREC rank 2640.
//
// Rulings:
//   [2024-09-20] If Gleeful Arsonist is no longer on the battlefield when its first ability
//     resolves, use its power as it last existed on the battlefield to determine how much damage
//     it deals.
//   [2024-09-20] Gleeful Arsonist's first ability resolves before the spell that caused it to
//     trigger. It resolves even if that spell is countered.
// "That player" is the opponent who cast the spell (`"trigger-controller"`,
// not a target); `{ powerOf: "source" }` reads last-known power once it has left.
const CAST_TEXT =
  "Whenever an opponent casts a noncreature spell, this creature deals damage equal to its power to that player.";

export default defineCard({
  name: "Gleeful Arsonist",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 2,
  text: `${CAST_TEXT}\nUndying (When this creature dies, if it had no +1/+1 counters on it, return it to the battlefield under its owner's control with a +1/+1 counter on it.)`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", noncreatureOnly: true },
      targets: [],
      effect: { kind: "damage", amount: { powerOf: "source" }, who: "trigger-controller" },
      resolve: null,
      text: CAST_TEXT,
    },
    undying(),
  ],
});
