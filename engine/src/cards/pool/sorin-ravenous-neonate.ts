import { defineCard } from "../define.js";
import { extort } from "../helpers.js";

// The back face of Sorin of House Markov.
//
// −6: "a white permanent other than that creature or Sorin" leaves both out
// of the count, and is asked after the creature has been taken.
const EXTORT_TEXT =
  "Extort (Whenever you cast a spell, you may pay {W/B}. If you do, each opponent loses 1 life and you gain that much life.)";
const PLUS_TEXT = "+2: Create a Food token.";
const MINUS1_TEXT = "−1: Sorin deals damage equal to the amount of life you gained this turn to any target.";
const MINUS6_TEXT =
  "−6: Gain control of target creature. It becomes a Vampire in addition to its other types. Put a " +
  "lifelink counter on it if you control a white permanent other than that creature or Sorin.";

export default defineCard({
  name: "Sorin, Ravenous Neonate",
  art: "https://cards.scryfall.io/art_crop/back/1/d/1d7474fc-0042-4be9-81f3-5f66f4b16740.jpg",
  colors: ["B", "W"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Sorin"],
  loyalty: 3,
  text: `${EXTORT_TEXT}\n${PLUS_TEXT}\n${MINUS1_TEXT}\n${MINUS6_TEXT}`,
  triggered: [extort()],
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -1,
      cost: { mana: null, tap: false },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { turnStat: "life-gained", who: "you" }, target: 0 },
      resolve: null,
      text: MINUS1_TEXT,
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 0, untilEndOfTurn: false },
          { kind: "add-types", target: 0, addSubtypes: ["Vampire"], duration: "permanent" },
          {
            kind: "conditional",
            condition: {
              kind: "controls",
              filter: { colors: ["W"] },
              atLeast: 1,
              excludeSelf: true,
              excludeTarget: 0,
            },
            then: { kind: "add-counter", target: 0, counter: "lifelink", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: MINUS6_TEXT,
    },
  ],
  faces: ["Sorin of House Markov", "Sorin, Ravenous Neonate"],
  transform: true,
});
