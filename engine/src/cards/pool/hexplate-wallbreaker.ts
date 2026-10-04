import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 3589.
// Makes Rebel → use "Rebel Token".
//
// Rulings:
//   [2023-02-04] There's no main phase between your combat phases, so you'll have no opportunity
//     to cast spells or activate abilities that could only be activated any time you could cast a
//     sorcery. For example, you won't be able to cast another creature or activate Hexplate
//     Wallbreaker's equip ability between combats.
//   [2023-02-04] If you attack with multiple creatures equipped with Hexplate Wallbreakers in one
//     combat phase (or one creature equipped with multiple Hexplate Wallbreakers), you'll have
//     that many additional combat phases, but your attacking creatures are untapped only during
//     the current combat phase.
//   [2023-02-04] If the ability causes two Rebel tokens to be created (due to an effect such as
//     that of Mondrak, Glory Dominus), the Equipment becomes attached to only one of them.
//   [2023-02-04] The Rebel enters the battlefield as a 2/2 creature, then the Equipment becomes
//     attached to it. Abilities that trigger when a creature enters the battlefield see that a 2/2
//     creature entered the battlefield.
//   [2023-02-04] If the Rebel is destroyed, the Equipment stays on the battlefield. Similarly, you
//     may pay its equip cost to move it from the Rebel token to another creature you control.
//   [2023-02-04] Once the equipped creature attacks and the triggered ability resolves, you get an
//     additional combat phase even if the equipped creature doesn't survive the first combat
//     phase.
//   [2023-02-04] Untapping an attacking creature doesn't remove it from combat.

// For Mirrodin! is living weapon's shape with a Rebel: the token enters as a
// 2/2, then the Equipment attaches to it (to one of them if two are made).
// "If it's the first combat phase of the turn" is the intervening-if, as on
// Genji Glove; "each attacking creature" untaps every attacker, not only the
// equipped one (Karlach's shape).
const MIRRODIN_TEXT =
  "For Mirrodin! (When this Equipment enters, create a 2/2 red Rebel creature token, then attach this to it.)";
const PUMP_TEXT = "Equipped creature gets +2/+2.";
const ATTACK_TEXT =
  "Whenever equipped creature attacks, if it's the first combat phase of the turn, untap each attacking creature. After this phase, there is an additional combat phase.";

export default defineCard({
  name: "Hexplate Wallbreaker",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${MIRRODIN_TEXT}\n${PUMP_TEXT}\n${ATTACK_TEXT}\nEquip {3}{R}`,
  static: [{ affects: { scope: "attached" }, grantPt: [2, 2], text: PUMP_TEXT }],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Rebel Token", count: 1 },
          { kind: "attach", target: "created", attachment: "source" },
        ],
      },
      resolve: null,
      text: MIRRODIN_TEXT,
    },
    {
      trigger: { on: "attacks", who: "attached" },
      condition: { kind: "turn-structure", combatPhase: 1 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: { type: "creature", attacking: true } },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{3}{R}")],
});
