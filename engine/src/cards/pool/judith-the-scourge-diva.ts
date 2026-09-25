import { defineCard } from "../define.js";

export default defineCard({
  name: "Judith, the Scourge Diva",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "Other creatures you control get +1/+0.\nWhenever a nontoken creature you control dies, Judith deals 1 damage to any target.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { token: false, type: "creature" } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever a nontoken creature you control dies, Judith deals 1 damage to any target.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 0],
      text: "Other creatures you control get +1/+0.",
    },
  ],
});
