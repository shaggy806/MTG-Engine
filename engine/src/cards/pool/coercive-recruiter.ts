import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 3680.
//
// Rulings:
//   [2020-11-10] Coercive Recruiter's ability can target any creature, even one that's untapped or
//     one you already control. It can even target itself or the creature that caused the ability
//     to trigger.
//   [2020-11-10] Gaining control of a creature doesn't cause you to gain control of any Auras or
//     Equipment attached to it.
//
// "This creature or another Pirate you control enters" is two triggers
// (Headless Rider's shape): its own entry, and another Pirate's. The effect
// is Act of Treason's, plus the Pirate type until end of turn.
const TEXT =
  "Whenever this creature or another Pirate you control enters, gain control of target creature until end of turn. Untap that creature. Until end of turn, it gains haste and becomes a Pirate in addition to its other types.";
const THREATEN: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "gain-control", target: 0, untilEndOfTurn: true },
    { kind: "untap", target: 0 },
    { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
    { kind: "add-types", target: 0, addSubtypes: ["Pirate"], duration: "end-of-turn" },
  ],
};

export default defineCard({
  name: "Coercive Recruiter",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Orc", "Pirate"],
  power: 4,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: THREATEN,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { subtype: "Pirate" } },
      targets: ["creature"],
      effect: THREATEN,
      resolve: null,
      text: TEXT,
    },
  ],
});
