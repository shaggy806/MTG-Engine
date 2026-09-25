import type { EffectAmount } from "../../effects.js";
import { defineCard } from "../define.js";

// #177 in top-commanders.txt.
//
// X is read as the trigger resolves (the creature as it is then, or as it
// last existed if it has left).
const COST_TEXT = "Each creature spell you cast with toughness greater than its power costs {1} less to cast.";
const PUMP_TEXT =
  "Whenever a creature you control attacks or blocks, it gets +X/+X until end of turn, where X is " +
  "the difference between its power and toughness.";
const difference: EffectAmount = {
  difference: [{ powerOf: "trigger-object" }, { toughnessOf: "trigger-object" }],
  absolute: true,
};

export default defineCard({
  name: "Doran, Besieged by Time",
  manaCost: "{1}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Treefolk", "Druid"],
  power: 0,
  toughness: 5,
  text: `${COST_TEXT}\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", toughness: { op: "gt", n: { own: "power" } } },
        caster: "you",
        reduceGeneric: 1,
      },
      text: COST_TEXT,
    },
  ],
  triggered: (["attacks", "blocks"] as const).map((on) => ({
    trigger: { on, who: "you-control" as const },
    targets: [],
    effect: {
      kind: "modify-pt" as const,
      target: "trigger-object" as const,
      power: difference,
      toughness: difference,
      duration: "end-of-turn" as const,
    },
    resolve: null,
    text: PUMP_TEXT,
  })),
});
