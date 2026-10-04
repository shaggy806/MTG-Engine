import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// EDHREC rank 4651.
//
// Rulings:
//   [2020-04-17] Brallin's middle ability gives it only one +1/+1 counter each time it resolves,
//     no matter how many opponents are dealt damage.
//   [2020-04-17] Brallin's middle ability deals 1 damage to each opponent even if you can't put a
//     +1/+1 counter on Brallin, most likely because Brallin has left the battlefield.
//   [2020-04-17] If you discard a card as a cost to cast a spell or activate an ability, Brallin's
//     middle ability resolves before that spell or ability but after you've chosen targets for it.
//     If you discard a card while a spell or ability is resolving, that spell or ability finishes
//     resolving before Brallin's triggered ability does.'
//   [2020-04-17] Note that the target player searches their library (which may be affected by
//     effects such as that of Stranglehold) and that the card they find is revealed, even though
//     these words aren't included in the ability's reminder text.
//   [2020-04-17] "Partner with [name]" represents two abilities. The first is a triggered ability:
//     "When this permanent enters the battlefield, target player may search their library for a
//     card named [name], reveal it, put it into their hand, then shuffle their library."

const DISCARD_TEXT =
  "Whenever you discard a card, put a +1/+1 counter on Brallin and it deals 1 damage to each opponent.";
const TRAMPLE_TEXT = "{R}: Target Shark gains trample until end of turn.";

export default defineCard({
  name: "Brallin, Skyshark Rider",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 3,
  toughness: 3,
  pairing: { kind: "partner-with", name: "Shabraz, the Skyshark" },
  text: `Partner with Shabraz, the Skyshark (When this creature enters, target player may put Shabraz into their hand from their library, then shuffle.)\n${DISCARD_TEXT}\n${TRAMPLE_TEXT}`,
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [{ kind: "permanent", filter: { subtype: "Shark" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: TRAMPLE_TEXT,
    },
  ],
  triggered: [
    partnerWithTrigger("Shabraz, the Skyshark"),
    {
      // Once per card discarded.
      trigger: { on: "discards", who: "you", perCard: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "damage", amount: 1, who: "each-opponent" },
        ],
      },
      resolve: null,
      text: DISCARD_TEXT,
    },
  ],
});
