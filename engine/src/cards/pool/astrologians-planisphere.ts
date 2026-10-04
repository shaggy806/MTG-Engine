import { defineCard } from "../define.js";
import type { TriggeredAbility } from "../../abilities.js";
import { equip } from "../helpers.js";

// EDHREC rank 5257.
// Makes Hero → use "Hero Token (Black Mage's Rod)".
//
// Rulings:
//   [2025-06-06] The Hero token enters as a 1/1 creature, then the Equipment becomes attached to
//     it. Abilities that trigger when a creature enters the battlefield see that a 1/1 creature
//     entered the battlefield.
//   [2025-06-06] You may pay the Equipment's equip cost as normal to move it from the Hero token
//     to another creature you control.
//   [2025-06-06] Astrologian's Planisphere doesn't need to have been attached to a creature you
//     control when the first or second card is drawn for the granted ability to trigger. As long
//     as a creature you control has the granted ability when you draw your third card in a turn,
//     that ability will trigger.
//   [2025-06-06] If the Hero token is destroyed, the Equipment stays on the battlefield.
//   [2025-06-06] If the job select ability causes two Hero tokens to be created (due to an effect
//     such as that of Doubling Season), the Equipment becomes attached to only one of them.

const JOB_TEXT =
  "Job select (When this Equipment enters, create a 1/1 colorless Hero creature token, then attach this to it.)";
const GROW_TEXT =
  "Whenever you cast a noncreature spell and whenever you draw your third card each turn, put a +1/+1 counter on this creature.";
const EQUIPPED_TEXT = `Equipped creature is a Wizard in addition to its other types and has "${GROW_TEXT}"`;

// The equipped creature's own ability (one ability, two trigger conditions —
// written as two triggered abilities with the same effect), so "this
// creature" is the creature. The third draw is counted over the whole turn,
// whether or not it had the ability for the first two (the ruling).
const GROW_ON_CAST: TriggeredAbility = {
  trigger: { on: "cast-spell", who: "you", filter: { notTypes: ["creature"] } },
  targets: [],
  effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
  resolve: null,
  text: GROW_TEXT,
};
const GROW_ON_DRAW: TriggeredAbility = {
  trigger: { on: "draws", who: "you", nthEachTurn: 3 },
  targets: [],
  effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
  resolve: null,
  text: GROW_TEXT,
};

export default defineCard({
  name: "Astrologian's Planisphere",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${JOB_TEXT}\n${EQUIPPED_TEXT}\nDiana — Equip {2}`,
  triggered: [
    {
      // Job select — Black Mage's Rod's shape.
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
      grantsTriggered: [GROW_ON_CAST, GROW_ON_DRAW],
      addSubtypes: ["Wizard"],
      text: EQUIPPED_TEXT,
    },
  ],
  // "Diana" is an ability word: the ability is plain equip {2}.
  activated: [{ ...equip("{2}"), text: "Diana — Equip {2}" }],
});
