import { defineCard } from "../define.js";

// EDHREC rank 5198.
//
// Rulings:
//   [2018-06-08] If a spell or ability causes you to put cards in your hand without specifically
//     using the word "draw," Toothy's middle ability won't trigger.
//   [2018-06-08] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won't have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 damage from one of them, not from both of them
//     combined. Command Beacon's effect puts one into your hand from the command zone, not both.
//   [2018-06-08] The triggered ability of the "partner with" keyword still triggers in a Commander
//     game. If your other commander has somehow ended up in your library, you can find it. You can
//     also target another player who might have that card in their library.
//   [2018-06-08] If you draw multiple cards, Toothy's middle ability triggers that many times. If
//     your team also controls Pir, each of those resolving triggered abilities puts two +1/+1
//     counters on Toothy.
//   [2018-06-08] If your Commander deck has two commanders, you can only include cards whose own
//     color identities are also found in your commanders' combined color identities. If Khorvath
//     and Sylvia are your commanders, your deck may contain cards with red and/or white in their
//     color identity, but not blue, black, or green.
//   [2018-06-08] The second ability represented by the "partner with [name]" keyword modifies the
//     rules for deck construction in the Commander variant and has no function outside of that
//     variant. If a legendary creature card with "partner with [name]" is designated as your
//     commander, the named legendary creature card can also be designated as your commander. For
//     more information on the Commander variant, please visit Wizards.com/Commander.
//   [2018-06-08] "Partner with [name]" represents two abilities. The first is a triggered ability:
//     "When this permanent enters the battlefield, target player may search their library for a
//     card named [name], reveal it, put it into their hand, then shuffle their library."
//   [2018-06-08] Note that the target player searches their library (which may be affected by
//     effects such as that of Stranglehold) and that the card they find is revealed, even though
//     these words aren't included in the ability's reminder text.
//   [2018-06-08] If enough -1/-1 counters are put on Toothy at the same time to make its toughness
//     0 or less, the number of +1/+1 counters on it before it got any -1/-1 counters will be used
//     to determine how many cards you draw. For example, if there are two +1/+1 counters on Toothy
//     and it gets three -1/-1 counters, you'll draw two cards.
//   [2018-06-08] To have two commanders, both must have the partner ability (featured in the
//     Magic: The Gathering—Commander™ (2016 Edition) set) or corresponding "partner with"
//     abilities as the game begins. A creature with a "partner with" ability can't partner with
//     any creature other than its designated partner. Losing a partner ability during the game
//     doesn't cause either to cease to be your commander.
//   [2018-06-08] Both commanders start in the command zone, and the remaining 98 cards of your
//     deck are shuffled to become your library.
//   [2018-06-08] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.

export default defineCard({
  name: "Toothy, Imaginary Friend",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 1,
  toughness: 1,
  pairing: { kind: "partner-with", name: "Pir, Imaginative Rascal" },
  text: "Partner with Pir, Imaginative Rascal (When this creature enters, target player may put Pir into their hand from their library, then shuffle.)\nWhenever you draw a card, put a +1/+1 counter on Toothy.\nWhen Toothy leaves the battlefield, draw a card for each +1/+1 counter on it.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Pir, Imaginative Rascal" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Pir, Imaginative Rascal, reveal it, put it into their hand, then shuffle.",
    },
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you draw a card, put a +1/+1 counter on Toothy.",
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      // Marketback Walker's count, read as Toothy last existed (rule 603.10a);
      // 704.5q annihilation spares a creature dying in the same check (the
      // -1/-1 ruling).
      effect: { kind: "draw", amount: { countersOn: "source", counter: "+1/+1" } },
      resolve: null,
      text: "When Toothy leaves the battlefield, draw a card for each +1/+1 counter on it.",
    },
  ],
});
