import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

const TEXT =
  "Delayed Blast Fireball deals 2 damage to each opponent and each creature they control. If " +
  "this spell was cast from exile, it deals 5 damage to each opponent and each creature they " +
  "control instead.";

const blast = (amount: number): EffectSpec => ({
    // One instruction: the players and their creatures are dealt it together.
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "damage", amount, who: "each-opponent" },
      { kind: "damage-all", filter: { type: "creature" }, whose: "each-opponent", amount },
    ],
});

// Any cast from exile counts, foretold or otherwise.
export default defineCard({
  name: "Delayed Blast Fireball",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text: `${TEXT}\nForetell {4}{R}{R} (During your turn, you may pay {2} and exile this card from your hand face down. Cast it on a later turn for its foretell cost.)`,
  foretell: { cost: "{4}{R}{R}" },
  effect: {
    kind: "conditional",
    condition: { kind: "source", filter: { castFrom: "exile" } },
    then: blast(5),
    else: blast(2),
  },
});
