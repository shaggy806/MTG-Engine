import { defineCard } from "../define.js";

// "Artifacts you control are Foods" is a layer-4 subtype grant, so the Food
// sacrifice cost, and anything else counting Foods, sees every artifact. The
// granted ability goes to exactly the artifacts made Foods (rule 613.6); a
// Food token keeps its own copy of it as well.
export default defineCard({
  name: "Ragost, Deft Gastronaut",
  manaCost: "{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Lobster", "Citizen"],
  power: 2,
  toughness: 2,
  text:
    "Artifacts you control are Foods in addition to their other types and have \"{2}, {T}, Sacrifice this artifact: You gain 3 life.\"\n" +
    "{1}, {T}, Sacrifice a Food: Ragost deals 3 damage to each opponent.\n" +
    "At the beginning of each end step, if you gained life this turn, untap Ragost.",
  static: [
    {
      affects: { scope: "filter", filter: { type: "artifact", controlledBy: "you" } },
      addSubtypes: ["Food"],
      grantsActivated: [
        {
          cost: { mana: "{2}", tap: true, sacrifice: "self" },
          targets: [],
          effect: { kind: "gain-life", amount: 3 },
          resolve: null,
          text: "{2}, {T}, Sacrifice this artifact: You gain 3 life.",
        },
      ],
      text: "Artifacts you control are Foods in addition to their other types and have \"{2}, {T}, Sacrifice this artifact: You gain 3 life.\"",
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: { filter: { subtype: "Food" } } },
      targets: [],
      effect: { kind: "damage", amount: 3, who: "each-opponent" },
      resolve: null,
      text: "{1}, {T}, Sacrifice a Food: Ragost deals 3 damage to each opponent.",
    },
  ],
  triggered: [
    {
      // "**Each** end step" — yours and everyone else's.
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "At the beginning of each end step, if you gained life this turn, untap Ragost.",
    },
  ],
});
