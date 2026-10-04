import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 4801.
// Makes Hero → use "Hero Token (Black Mage's Rod)".
//
// Rulings:
//   [2025-06-06] If the Hero token is destroyed, the Equipment stays on the battlefield.
//   [2025-06-06] You may pay the Equipment's equip cost as normal to move it from the Hero token
//     to another creature you control.
//   [2025-06-06] The Hero token enters as a 1/1 creature, then the Equipment becomes attached to
//     it. Abilities that trigger when a creature enters the battlefield see that a 1/1 creature
//     entered the battlefield.
//   [2025-06-06] If the job select ability causes two Hero tokens to be created (due to an effect
//     such as that of Doubling Season), the Equipment becomes attached to only one of them.

const JOB_TEXT =
  "Job select (When this Equipment enters, create a 1/1 colorless Hero creature token, then attach this to it.)";
const EQUIPPED_TEXT =
  "Equipped creature gets +2/+2 for each artifact you control and is an Artificer in addition to its other types.";

export default defineCard({
  name: "Machinist's Arsenal",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${JOB_TEXT}\n${EQUIPPED_TEXT}\nMachina — Equip {4} ({4}: Attach to target creature you control. Equip only as a sorcery.)`,
  triggered: [
    {
      // Job select — Black Mage's Rod's shape: the Hero enters, then the
      // Equipment is attached to it (one of them, with two made).
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Hero Token (Black Mage's Rod)", count: 1 },
          { kind: "attach", target: "created", attachment: "source" },
        ],
      },
      resolve: null,
      text: JOB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "artifact", controlledBy: "you" }, pt: [2, 2] },
      addSubtypes: ["Artificer"],
      text: EQUIPPED_TEXT,
    },
  ],
  // "Machina" is an ability word: the ability is plain equip {4}.
  activated: [{ ...equip("{4}"), text: "Machina — Equip {4}" }],
});
