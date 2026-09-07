import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 9 — a legendary creature so Dave's seat has a real commander.
 * A GW go-wide anchor built entirely from existing vocab: a `grantPt` anthem
 * that excludes itself, plus a "another creature you control enters" trigger.
 */
export default defineCard({
  name: "Seraphine, Dawnherald",
  manaCost: "{2}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel", "Cleric"],
  power: 3,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\nOther creatures you control get +1/+1.\nWhenever another creature you control enters, you gain 1 life.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control get +1/+1.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature" },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control enters, you gain 1 life.",
    },
  ],
});
