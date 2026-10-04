import { defineCard } from "../define.js";

// EDHREC rank 5526.
//
// Rulings:
//   [2025-06-06] Aerith's last ability checks at the moment it would trigger to see if you gained
//     life this turn. If you didn't, the ability won't trigger at all. Once your end step begins,
//     it's too late to gain life in order to cause this ability to trigger. However, the last part
//     of the ability will check how much life you've gained as the ability resolves, so if you've
//     only gained 5 life this turn by the time the end step comes around, you could still gain 2
//     more life while this ability is on the stack in order to return the target creature card to
//     the battlefield instead of your hand.
//
// An intervening-if (Crested Sunmare's), and Meren's resolution-time
// `conditional` choosing between the battlefield and the hand.

const RAISE_TEXT =
  "Raise — At the beginning of your end step, if you gained life this turn, return target creature card from your graveyard to your hand. If you gained 7 or more life this turn, return that card to the battlefield instead.";

export default defineCard({
  name: "Aerith, Last Ancient",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Druid"],
  power: 3,
  toughness: 5,
  keywords: ["lifelink"],
  text: `Lifelink\n${RAISE_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "conditional",
        condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 7 },
        then: { kind: "put-onto-battlefield", target: 0 },
        else: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: RAISE_TEXT,
    },
  ],
});
