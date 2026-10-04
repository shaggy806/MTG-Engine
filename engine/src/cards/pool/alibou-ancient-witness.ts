import { defineCard } from "../define.js";

// EDHREC rank 2474.
//
// Rulings:
//   [2021-04-16] You choose a target as Alibou's triggered ability is put on the stack. If that
//     target isn't legal as the triggered ability tries to resolve, it doesn't resolve and you
//     don't scry.
//   [2021-04-16] If Alibou leaves the battlefield, artifact creatures you control lose haste. If
//     they haven't been under your control since the turn began and don't otherwise have haste,
//     they can't attack that turn. If they've already attacked, losing haste won't remove them
//     from combat and they'll remain attackers.
//   [2021-04-16] If you control no tapped artifacts when the triggered ability resolves (perhaps
//     because they were destroyed or had vigilance), no damage will be dealt and you won't scry.

const HASTE_TEXT = "Other artifact creatures you control have haste.";
const ATTACK_TEXT =
  "Whenever one or more artifact creatures you control attack, Alibou deals X damage to any target and you scry X, where X is the number of tapped artifacts you control.";
const TAPPED_ARTIFACTS = { countOf: { type: "artifact", controlledBy: "you", tapped: true } } as const;

export default defineCard({
  name: "Alibou, Ancient Witness",
  manaCost: "{3}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 4,
  toughness: 5,
  text: `${HASTE_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
  triggered: [
    {
      // Once per declaration, however many artifact creatures attack. X is read as it resolves.
      trigger: { on: "attacks-batch", who: "you", filter: { types: ["artifact", "creature"] } },
      targets: ["any-target"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: TAPPED_ARTIFACTS, target: 0 },
          { kind: "scry", amount: TAPPED_ARTIFACTS },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
