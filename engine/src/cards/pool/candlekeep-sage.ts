import { defineCard } from "../define.js";

// EDHREC rank 5612.
//
// Rulings:
//   [2022-06-10] If you control a Background that grants an ability to commander creatures you
//     own, and you own more than one commander creature, each of them will have that ability.
//   [2022-06-10] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won’t have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 combat damage from any one of them, not from both
//     of them combined (although your Background won’t usually be a creature anyway).
//   [2022-06-10] If something refers to your commander while you have two commanders, it refers to
//     one of them of your choice. If you are instructed to perform an action on your commander
//     (e.g. put it from the command zone into your hand due to Command Beacon), you choose one of
//     your commanders at the time the effect happens.
//   [2022-06-10] If your commander loses the choose a Background ability or stops being a
//     Background during the game, as appropriate, it is still your commander.
//   [2022-06-10] Choose a Background is a variant of the partner ability. You may have two
//     commanders if one of them is a legendary creature with the choose a background ability and
//     the other is a legendary Background enchantment. Backgrounds and cards with choose a
//     Background do not interact with cards which have any other partner ability.
//   [2022-06-10] You can choose two commanders that are the same color or colors.
//   [2022-06-10] If a card refers to a commander creature you own, a Background won't usually be
//     counted or included for that effect. If another spell or ability causes your Background to
//     become a creature, however, it will be included. Any effect that refers to your commander or
//     a commander you own or control without specifying creature will apply to a Background that
//     is your commander, as appropriate.
//   [2022-06-10] If your Commander deck has two commanders, you can include only cards whose own
//     color identities are also found in your commanders’ combined color identities.
//   [2022-06-10] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.
//   [2022-06-10] Both commanders start in the command zone, and the remaining 98 cards (or 58
//     cards in a Commander Draft game) of your deck are shuffled to become your library.

const GRANTED_TEXT = "When this creature enters or leaves the battlefield, draw a card.";
const TEXT = `Commander creatures you own have "${GRANTED_TEXT}"`;

// Passionate Archaeologist's Background shape, granting Cryogen Relic's two
// triggers. The leaves trigger looks back to the creature as it last was
// (rule 603.10a), granted abilities included.
export default defineCard({
  name: "Candlekeep Sage",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Background"],
  text: "Commander creatures you own have \"When this creature enters or leaves the battlefield, draw a card.\"",
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", isCommander: true, ownedBy: "you" } },
      grantsTriggered: [
        {
          trigger: { on: "enters-battlefield", who: "self" },
          targets: [],
          effect: { kind: "draw", amount: 1 },
          resolve: null,
          text: GRANTED_TEXT,
        },
        {
          trigger: { on: "leaves-battlefield", who: "self" },
          targets: [],
          effect: { kind: "draw", amount: 1 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
