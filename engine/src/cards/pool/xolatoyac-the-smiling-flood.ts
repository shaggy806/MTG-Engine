import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 5074.
//
// Rulings:
//   [2023-11-10] The land stays an Island until the flood counter is removed, even if Xolatoyac,
//     the Smiling Flood leaves the battlefield.
//   [2023-11-10] The land retains any land types and abilities it already had. An Island has the
//     ability "{T}: Add {U}."

// Eluge, the Shoreless Sea's flood trigger: the land stays an Island for as
// long as the counter does, Xolatoyac gone or not (the ruling).
const FLOOD_TEXT =
  "Whenever Xolatoyac enters or attacks, put a flood counter on target land. That land is an Island in addition to its other types for as long as it has a flood counter on it.";
const UNTAP_TEXT = "At the beginning of your end step, untap each permanent you control with a counter on it.";

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
  name: "Xolatoyac, the Smiling Flood",
  manaCost: "{4}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Salamander", "Serpent"],
  power: 6,
  toughness: 6,
  text: `${FLOOD_TEXT}\n${UNTAP_TEXT}`,
  triggered: [
    flood("enters-battlefield"),
    flood("attacks"),
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "untap-all",
        filter: { controlledBy: "you", counters: { compare: { op: "gte", n: 1 } } },
      },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
