import { defineCard } from "../define.js";

// EDHREC rank 4467.
//
// Rulings:
//   [2008-05-01] Knollspine Dragon's ability checks only whether damage was dealt. It doesn't care
//     whether the player's life total also changed for other reasons (such as if the player paid
//     life or gained life).
//   [2008-05-01] This ability counts the total amount of damage (both combat and noncombat) dealt
//     to the targeted opponent by all sources (including ones you controlled and ones you didn't)
//     over the course of the turn. Damage that was prevented or replaced doesn't count. Damage
//     that resolved but didn't cause loss of life (due to Worship, for example) will count.
//   [2008-05-01] You target an opponent when the ability triggers. You don't decide whether you
//     want to discard and draw until the ability resolves.
//
// The opponent is the trigger's target; the "may" is asked as it resolves. The
// count is the target's `damage-taken` turn stat (damage dealt, not life lost).

const TEXT =
  "When this creature enters, you may discard your hand and draw cards equal to the damage dealt to target opponent this turn.";

export default defineCard({
  name: "Knollspine Dragon",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 7,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "may",
        prompt: "Discard your hand and draw cards equal to the damage dealt to that opponent this turn?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard-hand", who: "you" },
            { kind: "draw", amount: { turnStat: "damage-taken", target: 0 } },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
