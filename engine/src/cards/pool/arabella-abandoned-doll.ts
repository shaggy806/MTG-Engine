import { defineCard } from "../define.js";

// Rank 52 on the commander list. Its one triggered ability is already covered by
// existing vocabulary: an `attacks` trigger (Edgar Markov), damage to a whole
// scope of players (Breath of Malfegor), and an X that is a live count with a
// *power* clause (Shamanic Revelation, Temur Battlecrier).
//
// - "it deals X damage": the ability's source is Arabella, so the damage is
//   hers. That means lifelink on her and damage doublers such as Dictate of the
//   Twin Gods apply through `dealDamage`, the same as for any other damage she
//   deals. The damage is noncombat.
// - "creatures you control with power 2 or less": `matchesFilter` reads the
//   power clause off the full characteristics fold. An anthem that lifts a 2/2
//   to 3/3 takes it out of the count, and a -1/-1 effect can put one back in.
//   Arabella counts herself while her own power is 2 or less, as printed.
// - "you gain X life": X again, not the damage actually dealt, so prevention
//   or doubling changes the damage and leaves the life gain alone.
//
// The one ruling (2024-09-20): "The value of X is determined only once, as
// Arabella's ability resolves" (rule 608.2h). A `sequence` evaluates its
// amount once per step, so X is read twice: once for the damage and once for
// the life. Gray Merchant of Asphodel reads its devotion twice the same way.
// Both reads give the same result today, because nothing that can happen
// between the two steps changes a creature's power. The only events in
// between are damage to players and life changes (Arabella's own lifelink).
// Triggers they cause wait for the stack, and state-based actions wait for
// the resolution to finish (rule 704.3), so no permanent moves. No static or
// characteristic-defining ability in the pool feeds a life total, or this
// turn's life lost or gained, into P/T. The `turn-stat` and
// `opponent-lost-life-this-turn` conditions gate only Y'shtola's end-step
// trigger and Theater of Horrors' cast permission, and `setBasePtFromCount`
// counts graveyards and lands. A future card that ties power to life would
// make the two reads differ, and this card would then need X snapshotted once.
const ATTACK_TEXT =
  "Whenever Arabella attacks, it deals X damage to each opponent and you gain X life, " +
  "where X is the number of creatures you control with power 2 or less.";

const X = {
  countOf: { type: "creature", controlledBy: "you", power: { op: "lte", n: 2 } },
} as const;

export default defineCard({
  name: "Arabella, Abandoned Doll",
  manaCost: "{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Toy"],
  power: 1,
  toughness: 3,
  text: ATTACK_TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: X, who: "each-opponent" },
          { kind: "gain-life", amount: X },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
