import { defineCard } from "../define.js";

// EDHREC rank 3526.
//
// Rulings:
//   [2022-10-07] Both the first and last abilities of Shadow in the Warp take into account spells
//     cast before it was on the battlefield. For example, if an opponent cast a noncreature spell
//     before it was on the battlefield, then casts a noncreature spell after it is put on the
//     battlefield, Shadow in the Warp's second ability won't trigger because that is the second
//     noncreature spell they've cast that turn.
//
// "Their first noncreature spell" counts matching spells (a `filter`, as
// Esper Sentinel), not their first spell; "that player" is the caster.
const COST_TEXT = "The first creature spell you cast each turn costs {2} less to cast.";
const CAST_TEXT =
  "Whenever an opponent casts their first noncreature spell each turn, this enchantment deals 2 damage to that player.";

export default defineCard({
  name: "Shadow in the Warp",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["enchantment"],
  text: `${COST_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "creature" }, caster: "you", reduceGeneric: 2, firstEachTurn: true },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", firstEachTurn: true, filter: { notTypes: ["creature"] } },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
