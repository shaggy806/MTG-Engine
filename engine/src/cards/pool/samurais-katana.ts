import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 6653.
// Makes Hero → use "Hero Token (Black Mage's Rod)".
//
// Rulings:
//   [2025-06-06] You may pay the Equipment's equip cost as normal to move it from the Hero token
//     to another creature you control.
//   [2025-06-06] If the Hero token is destroyed, the Equipment stays on the battlefield.
//   [2025-06-06] The Hero token enters as a 1/1 creature, then the Equipment becomes attached to
//     it. Abilities that trigger when a creature enters the battlefield see that a 1/1 creature
//     entered the battlefield.
//   [2025-06-06] If the job select ability causes two Hero tokens to be created (due to an effect
//     such as that of Doubling Season), the Equipment becomes attached to only one of them.

const JOB_TEXT =
  "Job select (When this Equipment enters, create a 1/1 colorless Hero creature token, then attach this to it.)";
const EQUIPPED_TEXT =
  "Equipped creature gets +2/+2, has trample and haste, and is a Samurai in addition to its other types.";

export default defineCard({
  name: "Samurai's Katana",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${JOB_TEXT}\n${EQUIPPED_TEXT}\nMurasame — Equip {5}`,
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
      grantPt: [2, 2],
      grantKeywords: ["trample", "haste"],
      addSubtypes: ["Samurai"],
      text: EQUIPPED_TEXT,
    },
  ],
  // "Murasame" is an ability word: the ability is plain equip {5}.
  activated: [{ ...equip("{5}"), text: "Murasame — Equip {5}" }],
});
