import { defineCard } from "../define.js";

// EDHREC rank 5892.
//
// Rulings:
//   [2011-09-22] If the targeted creature is an illegal target by the time Grimgrin's last ability
//     resolves, the entire ability doesn't resolve and none of its effects will occur. You won't
//     put a +1/+1 counter on Grimgrin.
//   [2013-07-01] If Grimgrin's last ability resolves, but the targeted creature isn't destroyed
//     (perhaps because it regenerated or has indestructible), you'll still put a +1/+1 on
//     Grimgrin.

const ENTER_TEXT = "Grimgrin enters tapped and doesn't untap during your untap step.";
const SAC_TEXT = "Sacrifice another creature: Untap Grimgrin and put a +1/+1 counter on it.";
const ATTACK_TEXT =
  "Whenever Grimgrin attacks, destroy target creature defending player controls, then put a +1/+1 counter on Grimgrin.";

export default defineCard({
  name: "Grimgrin, Corpse-Born",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Warrior"],
  power: 5,
  toughness: 5,
  text: `${ENTER_TEXT}\n${SAC_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "Grimgrin enters tapped.",
    },
    {
      affects: { scope: "self" },
      doesntUntap: true,
      text: "Grimgrin doesn't untap during your untap step.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: "source" },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-defending-player-controls"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
