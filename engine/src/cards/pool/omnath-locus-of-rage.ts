import { defineCard } from "../define.js";

// #315 in top-commanders.txt. "Omnath or another Elemental you control" is
// every Elemental you control, Omnath among them (the Undead Augur shape).
// When Omnath is the one that died, it deals the damage as it last existed
// on the battlefield.
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, create a 5/5 red and green Elemental " +
  "creature token.";
const DIES_TEXT =
  "Whenever Omnath or another Elemental you control dies, Omnath deals 3 damage to any target.";

export default defineCard({
  name: "Omnath, Locus of Rage",
  manaCost: "{3}{R}{R}{G}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  text: `${LANDFALL_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "5/5 Elemental Token", count: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Elemental" } },
      targets: ["any-target"],
      effect: { kind: "damage", target: 0, amount: 3 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
