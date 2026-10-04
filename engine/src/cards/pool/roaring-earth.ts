import { defineCard } from "../define.js";

// EDHREC rank 5302.
//
// Rulings:
//   [2022-02-18] Discarding the card is part of the cost to activate a channel ability.
//   [2022-02-18] If a channel ability requires a target, you may not activate it without a target
//     just to discard the card.
//   [2024-11-08] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//   [2024-11-08] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.

const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, put a +1/+1 counter on target creature or Vehicle you control.";
const CHANNEL_TEXT =
  "Channel — {X}{G}{G}, Discard this card: Put X +1/+1 counters on target land you control. It becomes a 0/0 green Spirit creature with haste. It's still a land.";

export default defineCard({
  name: "Roaring Earth",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${LANDFALL_TEXT}\n${CHANNEL_TEXT}`,
  activated: [
    {
      // Channel (`zone: "hand"` pays by discarding this card). The land
      // keeps its types and abilities and becomes a green 0/0 Spirit creature
      // with haste for good — no duration on the card; its counters make it
      // live.
      cost: { mana: "{X}{G}{G}", tap: false },
      targets: ["land-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: "x" },
          {
            kind: "animate",
            target: 0,
            power: 0,
            toughness: 0,
            addTypes: ["creature"],
            addSubtypes: ["Spirit"],
            setColors: ["G"],
            keywords: ["haste"],
            duration: "permanent",
          },
        ],
      },
      resolve: null,
      zone: "hand",
      text: CHANNEL_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [
        { kind: "permanent", whose: "you", filter: { anyOf: [{ type: "creature" }, { subtype: "Vehicle" }] } },
      ],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
