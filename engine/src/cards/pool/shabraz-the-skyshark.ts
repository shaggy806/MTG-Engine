import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// EDHREC rank 6545.
//
// Rulings:
//   [2020-04-17] Shabraz's middle ability has you gain 1 life even if you can't put a +1/+1
//     counter on Shabraz, most likely because Shabraz has left the battlefield.
//   [2020-04-17] If a spell or ability causes you to put cards into your hand without
//     specifically using the word "draw," it's not a card drawn.

const DRAW_TEXT = "Whenever you draw a card, put a +1/+1 counter on Shabraz and you gain 1 life.";
const FLYING_TEXT = "{W/U}: Target Human gains flying until end of turn.";

export default defineCard({
  name: "Shabraz, the Skyshark",
  manaCost: "{3}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Shark", "Bird"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  pairing: { kind: "partner-with", name: "Brallin, Skyshark Rider" },
  text: `Partner with Brallin, Skyshark Rider (When this creature enters, target player may put Brallin into their hand from their library, then shuffle.)\nFlying\n${DRAW_TEXT}\n${FLYING_TEXT}`,
  triggered: [
    partnerWithTrigger("Brallin, Skyshark Rider"),
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{W/U}", tap: false },
      targets: [{ kind: "permanent", filter: { subtype: "Human" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: FLYING_TEXT,
    },
  ],
});
