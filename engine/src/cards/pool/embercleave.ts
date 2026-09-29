import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const COST_TEXT = "This spell costs {1} less to cast for each attacking creature you control.";
const ATTACH_TEXT = "When Embercleave enters, attach it to target creature you control.";
const PUMP_TEXT = "Equipped creature gets +1/+1 and has double strike and trample.";

export default defineCard({
  name: "Embercleave",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["flash"],
  text: `Flash\n${COST_TEXT}\n${ATTACH_TEXT}\n${PUMP_TEXT}\nEquip {3}`,
  selfCostReduction: {
    // Unconditional — the count is what varies (rule 601.2f: only the
    // generic part comes off, so {R}{R} is always paid).
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { type: "creature", controlledBy: "you", attacking: true } },
  },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: ATTACH_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["double-strike", "trample"],
      text: PUMP_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
