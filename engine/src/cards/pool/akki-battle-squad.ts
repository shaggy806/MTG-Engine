import { defineCard } from "../define.js";

// EDHREC rank 4019.
//
// Rulings:
//   [2022-02-18] An Aura controlled by an opponent does not cause a creature you control to be
//     modified.
//   [2022-02-18] A creature that is equipped is considered modified no matter who controls the
//     Equipment that's attached to it.
//   [2022-02-18] A creature with a counter on it is considered modified no matter what kind of
//     counter it is or which player put it on that creature.
//   [2022-02-18] Notably, the triggered ability of Akki Battle Squad doesn't give you any
//     additional main phases. This means that you will move directly from the end of combat step
//     of one combat phase to the beginning of combat step of the next one.

const TEXT =
  "Whenever one or more modified creatures you control attack, untap all modified creatures you control. After this phase, there is an additional combat phase. This ability triggers only once each turn.";
const modified = { type: "creature", controlledBy: "you", modified: true } as const;

export default defineCard({
  name: "Akki Battle Squad",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Samurai"],
  power: 6,
  toughness: 6,
  text: "Whenever one or more modified creatures you control attack, untap all modified creatures you control. After this phase, there is an additional combat phase. This ability triggers only once each turn. (Equipment, Auras you control, and counters are modifications.)",
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1, filter: { modified: true } },
      oncePerTurn: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: modified },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
