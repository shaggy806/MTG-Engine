import { defineCard } from "../define.js";

// EDHREC rank 4821.

export default defineCard({
  name: "Cathedral of War",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\nExalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)\n{T}: Add {C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  triggered: [
    {
      // Exalted (rule 702.83) — Noble Hierarch's trigger.
      trigger: { on: "attacks-alone", who: "you-control" },
      targets: [],
      effect: { kind: "modify-pt", target: "trigger-object", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)",
    },
  ],
});
