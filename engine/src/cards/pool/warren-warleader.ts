import { defineCard } from "../define.js";
import { offspringTrigger } from "../helpers.js";

// EDHREC rank 4792.
// Makes a 1/1 token copy of itself (offspring — `offspringTrigger`'s create-token-copy).
// Makes Rabbit → use "Rabbit Token".
//
// Rulings:
//   [2024-07-26] If the spell is countered, the offspring ability will not trigger, and no token
//     will be created.
//   [2024-07-26] You choose the player, planeswalker, or battle the Rabbit token is attacking. It
//     doesn’t have to be the same player, planeswalker, or battle that any other attacking
//     creature is attacking.
//   [2024-07-26] Although the token enters attacking, it was never declared as an attacking
//     creature. Abilities that trigger whenever a creature attacks won’t trigger when that
//     creature enters attacking.
//   [2024-07-26] If the spell resolves but the creature with offspring leaves the battlefield
//     before the offspring ability resolves, you’ll still create a token copy of it.

const ATTACK_TEXT = "Whenever you attack, choose one —";
const RABBIT_MODE = "Create a 1/1 white Rabbit creature token that's tapped and attacking.";
const PUMP_MODE = "Attacking creatures you control get +1/+1 until end of turn.";

export default defineCard({
  name: "Warren Warleader",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rabbit", "Knight"],
  power: 4,
  toughness: 4,
  text: `Offspring {2} (You may pay an additional {2} as you cast this spell. If you do, when this creature enters, create a 1/1 token copy of it.)\n${ATTACK_TEXT}\n• ${RABBIT_MODE}\n• ${PUMP_MODE}`,
  kicker: { cost: "{2}", keyword: "offspring" },
  triggered: [
    offspringTrigger(),
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: RABBIT_MODE,
            // Its controller picks what it attacks (the ruling).
            effect: { kind: "create-token", token: "Rabbit Token", count: 1, tapped: true, attacking: "choose" },
          },
          {
            text: PUMP_MODE,
            effect: {
              kind: "modify-pt-all",
              filter: { type: "creature", attacking: true, controlledBy: "you" },
              power: 1,
              toughness: 1,
              duration: "end-of-turn",
            },
          },
        ],
      },
      resolve: null,
      text: `${ATTACK_TEXT} ${RABBIT_MODE} ${PUMP_MODE}`,
    },
  ],
});
