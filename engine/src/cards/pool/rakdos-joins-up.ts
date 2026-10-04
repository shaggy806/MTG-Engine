import { defineCard } from "../define.js";

// EDHREC rank 3545.
//
// Rulings:
//   [2024-04-12] Use the power of the legendary creature as it last existed on the battlefield to
//     determine how much damage is dealt.
//
// "That creature's power" is read off the trigger object's last-known
// information (rule 608.2h).
const ENTERS_TEXT =
  "When Rakdos Joins Up enters, return target creature card from your graveyard to the battlefield with two additional +1/+1 counters on it.";
const DIES_TEXT =
  "Whenever a legendary creature you control dies, Rakdos Joins Up deals damage equal to that creature's power to target opponent.";

export default defineCard({
  name: "Rakdos Joins Up",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: `${ENTERS_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0, withCounters: { kind: "+1/+1", amount: 2 } },
      resolve: null,
      text: ENTERS_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { supertype: "legendary", type: "creature" } },
      targets: ["opponent"],
      effect: { kind: "damage", target: 0, amount: { powerOf: "trigger-object" } },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
