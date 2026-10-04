import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 2604.
// Makes Hero → new token "Hero Token (Black Mage's Rod)".
//
// Rulings:
//   [2025-06-06] The granted ability resolves before the spell that caused it to trigger. It
//     resolves even if that spell is countered or otherwise leaves the stack.
//   [2025-06-06] If the job select ability causes two Hero tokens to be created (due to an effect
//     such as that of Doubling Season), the Equipment becomes attached to only one of them.
//   [2025-06-06] The Hero token enters as a 1/1 creature, then the Equipment becomes attached to
//     it. Abilities that trigger when a creature enters the battlefield see that a 1/1 creature
//     entered the battlefield.
//   [2025-06-06] You may pay the Equipment's equip cost as normal to move it from the Hero token
//     to another creature you control.
//   [2025-06-06] If the Hero token is destroyed, the Equipment stays on the battlefield.

const JOB_TEXT =
  "Job select (When this Equipment enters, create a 1/1 colorless Hero creature token, then attach this to it.)";
const PING_TEXT = "Whenever you cast a noncreature spell, this creature deals 1 damage to each opponent.";
const EQUIPPED_TEXT = `Equipped creature gets +1/+0, has "${PING_TEXT}" and is a Wizard in addition to its other types.`;

// The equipped creature's own ability, so the creature is the damage source.
const PING: TriggeredAbility = {
  trigger: { on: "cast-spell", who: "you", filter: { notTypes: ["creature"] } },
  targets: [],
  effect: { kind: "damage", amount: 1, who: "each-opponent" },
  resolve: null,
  text: PING_TEXT,
};

export default defineCard({
  name: "Black Mage's Rod",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${JOB_TEXT}\n${EQUIPPED_TEXT}\nEquip {3}`,
  triggered: [
    {
      // Job select is living weapon's shape with a 1/1 Hero (the rulings):
      // the token enters, then the Equipment is attached to it; with two made
      // it goes onto one.
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
      grantPt: [1, 0],
      grantsTriggered: [PING],
      addSubtypes: ["Wizard"],
      text: EQUIPPED_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
