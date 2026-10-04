import { defineCard } from "../define.js";

// EDHREC rank 2687.
//
// Rulings:
//   [2022-12-08] If Pashalik Mons and one or more other Goblins you control die at the same time,
//     its ability will trigger for each of those creatures.
//   [2022-12-08] You can sacrifice Pashalik Mons to pay the cost of its last ability.

const DIES_TEXT =
  "Whenever Pashalik Mons or another Goblin you control dies, Pashalik Mons deals 1 damage to any target.";
const SAC_TEXT = "{3}{R}, Sacrifice a Goblin: Create two 1/1 red Goblin creature tokens.";

// Pashalik Mons is a Goblin itself, so one trigger covers "Pashalik Mons or
// another Goblin"; dying alongside other Goblins it triggers for each (the
// ruling). It may be the Goblin it sacrifices.
export default defineCard({
  name: "Pashalik Mons",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${DIES_TEXT}\n${SAC_TEXT}`,
  triggered: [
    // Two triggers, so it sees its own death whatever its subtypes then (a
    // token copy that's a Zombie still triggers for "Pashalik Mons").
    {
      trigger: { on: "dies", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: DIES_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Goblin" }, otherOnly: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 2 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
