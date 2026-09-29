import { defineCard } from "../define.js";

const COST_TEXT =
  "This spell costs {X} less to cast, where X is the total mana value of historic permanents you control. (Artifacts, legendaries, and Sagas are historic.)";
const BONUS_TEXT = "Equipped creature gets +10/+0 and has vigilance.";
const EQUIP_TEXT = "Equip legendary creature {2}";

const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;

// The reduction is worked out as it's cast, from what you control then (the
// rulings); its mana value stays 12. "Equip legendary creature" is an Equip
// ability like any other, with a narrower target.
export default defineCard({
  name: "Excalibur, Sword of Eden",
  manaCost: "{12}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${COST_TEXT}\n${BONUS_TEXT}\n${EQUIP_TEXT}`,
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: {
      aggregate: "sum",
      of: "mana-value",
      filter: { ...HISTORIC, controlledBy: "you" },
    },
  },
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [10, 0],
      grantKeywords: ["vigilance"],
      text: BONUS_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: EQUIP_TEXT,
      sorcerySpeed: true,
    },
  ],
});
