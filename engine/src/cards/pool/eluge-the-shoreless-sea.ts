import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// #153 in top-commanders.txt.
//
// A flooded land is an Island, so it taps for {U} (rule 305.6) besides what
// it already did, for as long as the counter stays — Eluge leaving doesn't
// end it (its rulings). The discount takes the spell's {U} first and then
// generic mana, one of either for each flooded land.
const PT_TEXT = "Eluge's power and toughness are each equal to the number of Islands you control.";
const FLOOD_TEXT =
  "Whenever Eluge enters or attacks, put a flood counter on target land. It's an Island in addition to its other " +
  "types for as long as it has a flood counter on it.";
const COST_TEXT =
  "The first instant or sorcery spell you cast each turn costs {U} (or {1}) less to cast for each land you control " +
  "with a flood counter on it.";

const flood = (on: "enters-battlefield" | "attacks"): TriggeredAbility => ({
  trigger: { on, who: "self" },
  targets: ["land"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "flood", amount: 1 },
      { kind: "add-types", target: 0, addSubtypes: ["Island"], duration: { whileCounter: "flood" } },
    ],
  },
  resolve: null,
  text: FLOOD_TEXT,
});

export default defineCard({
  name: "Eluge, the Shoreless Sea",
  manaCost: "{1}{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Fish"],
  power: 0,
  toughness: 0,
  text: `${PT_TEXT}\n${FLOOD_TEXT}\n${COST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { subtype: "Island", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
    {
      affects: { scope: "self" },
      costModification: {
        applies: { typesAnyOf: ["instant", "sorcery"] },
        caster: "you",
        firstEachTurn: true,
        reduceColored: "{U}",
        reduceColoredTimes: {
          countOf: { type: "land", controlledBy: "you", counters: { kind: "flood", compare: { op: "gte", n: 1 } } },
        },
      },
      text: COST_TEXT,
    },
  ],
  triggered: [flood("enters-battlefield"), flood("attacks")],
});
