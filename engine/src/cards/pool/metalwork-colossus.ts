import { defineCard } from "../define.js";

const REDUCTION_TEXT =
  "This spell costs {X} less to cast, where X is the total mana value of noncreature artifacts you control.";
const RETURN_TEXT = "Sacrifice two artifacts: Return this card from your graveyard to your hand.";

// The reduction is fixed as the total cost is determined (rule 601.2f), so an
// artifact counted for it may still be sacrificed for mana as the cost is
// paid (the rulings). The return is a graveyard ability whose cost doesn't
// move the card (`staysInZone`); its two artifacts are chosen as it's paid.
export default defineCard({
  name: "Metalwork Colossus",
  manaCost: "{11}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 10,
  toughness: 10,
  text: `${REDUCTION_TEXT}\n${RETURN_TEXT}`,
  selfCostReduction: {
    // Unconditional: the same always-true gate Blasphemous Act uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: {
      aggregate: "sum",
      of: "mana-value",
      filter: { type: "artifact", notTypes: ["creature"], controlledBy: "you" },
    },
  },
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" }, count: 2 } },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
