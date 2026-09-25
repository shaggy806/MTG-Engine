import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

// #402 in top-commanders.txt.
//
// Millicent is herself a nontoken Spirit, so "Millicent or another nontoken
// Spirit you control" is every nontoken Spirit you control.
const TEXT =
  "Whenever Millicent or another nontoken Spirit you control dies or deals combat damage to a player, " +
  "create a 1/1 white Spirit creature token with flying.";
const spirit = { subtype: "Spirit", token: false } as const;
const token = { kind: "create-token", token: "Spirit Token", count: 1 } as const;

export default defineCard({
  name: "Millicent, Restless Revenant",
  manaCost: "{5}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Soldier"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  selfCostReduction: affinity({ subtype: "Spirit" }),
  text:
    "Affinity for Spirits (This spell costs {1} less to cast for each Spirit you control.)\n" +
    `Flying\n${TEXT}`,
  triggered: [
    { trigger: { on: "dies", who: "you-control", filter: spirit }, targets: [], effect: token, resolve: null, text: TEXT },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: spirit },
      targets: [],
      effect: token,
      resolve: null,
      text: TEXT,
    },
  ],
});
