import { defineCard } from "../define.js";

// EDHREC rank 4519.
//
// Rulings:
//   [2022-12-02] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//   [2022-12-02] Distinguished Conjurer's first ability triggers whenever any creature other than
//     itself enters the battlefield under your control, including those returned by its last
//     ability.
//   [2022-12-02] When the card exiled by the second ability returns to the battlefield, it will be
//     a new object with no connection to the card that was exiled.
//
// The blink is Emiel the Blessed's shape.
const BLINK_TEXT =
  "{4}{W}, {T}: Exile another target creature you control, then return it to the battlefield under its owner's control.";

export default defineCard({
  name: "Distinguished Conjurer",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 2,
  text: `Whenever another creature you control enters, you gain 1 life.\n${BLINK_TEXT}`,
  activated: [
    {
      cost: { mana: "{4}{W}", tap: true },
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: { kind: "flicker", target: 0 },
      resolve: null,
      text: BLINK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control enters, you gain 1 life.",
    },
  ],
});
