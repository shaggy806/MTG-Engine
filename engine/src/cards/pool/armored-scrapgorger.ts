import { defineCard } from "../define.js";

// EDHREC rank 4634.
//
// Rulings:
//   [2023-02-04] If the card chosen as the target of the last ability is an illegal target as the
//     ability tries to resolve, most likely because it left the graveyard some other way, the
//     ability will fail to resolve and none of its effects will happen. Armored Scrapgorger won't
//     get an oil counter.
//   [2023-02-04] Armored Scrapgorger's last ability triggers whenever it becomes tapped for any
//     reason, not just due to its mana ability.
//
// The pump is Beastmaster Ascension's self-counters condition on a self
// static. "Becomes tapped" fires however it's tapped (Emmara's trigger); the
// oil counter is part of the targeted ability, so an illegal target on
// resolution gives none (the ruling).

const PUMP_TEXT = "This creature gets +3/+0 as long as it has three or more oil counters on it.";
const MANA_TEXT = "{T}: Add one mana of any color.";
const TAPPED_TEXT =
  "Whenever this creature becomes tapped, exile target card from a graveyard and put an oil counter on this creature.";

export default defineCard({
  name: "Armored Scrapgorger",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Beast"],
  power: 0,
  toughness: 3,
  text: `${PUMP_TEXT}\n${MANA_TEXT}\n${TAPPED_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "self-counters", counter: "oil", compare: { op: "gte", n: 3 } },
      grantPt: [3, 0],
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "self" },
      targets: [{ kind: "card-in-graveyard" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          { kind: "add-counter", target: "source", counter: "oil", amount: 1 },
        ],
      },
      resolve: null,
      text: TAPPED_TEXT,
    },
  ],
});
