import { defineCard } from "../define.js";

// EDHREC rank 4638.
//
// Aether Channeler's announced modal ETB: the mode, and its target, are
// chosen as the trigger goes on the stack.

const ETB_TEXT = "When this creature enters, choose one —";
const SMASH = "Smash the Chest — Destroy target artifact.";
const PRY =
  "Pry It Open — Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")";

export default defineCard({
  name: "Plundering Barbarian",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dwarf", "Barbarian"],
  power: 2,
  toughness: 2,
  text: `${ETB_TEXT}\n• ${SMASH}\n• ${PRY}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: SMASH, targets: ["artifact"], effect: { kind: "destroy", target: 0 } },
          { text: PRY, effect: { kind: "create-token", token: "Treasure Token", count: 1 } },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${SMASH} ${PRY}`,
    },
  ],
});
