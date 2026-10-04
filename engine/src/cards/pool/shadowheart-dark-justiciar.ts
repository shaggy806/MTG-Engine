import { defineCard } from "../define.js";

// EDHREC rank 3494.
//
// Rulings:
//   [2022-06-10] If your commander loses the choose a Background ability or stops being a
//     Background during the game, as appropriate, it is still your commander.
//   [2022-06-10] If you control a Background that grants an ability to commander creatures you
//     own, and you own more than one commander creature, each of them will have that ability.
//   [2022-06-10] If your Commander deck has two commanders, you can include only cards whose own
//     color identities are also found in your commanders’ combined color identities.
//   [2022-06-10] If something refers to your commander while you have two commanders, it refers to
//     one of them of your choice. If you are instructed to perform an action on your commander
//     (e.g. put it from the command zone into your hand due to Command Beacon), you choose one of
//     your commanders at the time the effect happens.
//   [2022-06-10] If a card refers to a commander creature you own, a Background won't usually be
//     counted or included for that effect. If another spell or ability causes your Background to
//     become a creature, however, it will be included. Any effect that refers to your commander or
//     a commander you own or control without specifying creature will apply to a Background that
//     is your commander, as appropriate.
//   [2022-06-10] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.
//   [2022-06-10] Both commanders start in the command zone, and the remaining 98 cards (or 58
//     cards in a Commander Draft game) of your deck are shuffled to become your library.
//   [2022-06-10] Choose a Background is a variant of the partner ability. You may have two
//     commanders if one of them is a legendary creature with the choose a background ability and
//     the other is a legendary Background enchantment. Backgrounds and cards with choose a
//     Background do not interact with cards which have any other partner ability.
//   [2022-06-10] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won’t have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 combat damage from any one of them, not from both
//     of them combined (although your Background won’t usually be a creature anyway).
//   [2022-06-10] You can choose two commanders that are the same color or colors.

export default defineCard({
  name: "Shadowheart, Dark Justiciar",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Elf", "Cleric"],
  power: 3,
  toughness: 4,
  pairing: { kind: "choose-a-background" },
  text: "{1}{B}, {T}, Sacrifice another creature: Draw X cards, where X is that creature's power.\nChoose a Background (You can have a Background as a second commander.)",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true, sacrifice: "creature-you-control" },
      targets: [],
      // The power is the sacrificed creature's as it last existed.
      effect: { kind: "draw", amount: { powerOf: "sacrificed" } },
      resolve: null,
      text: "{1}{B}, {T}, Sacrifice another creature: Draw X cards, where X is that creature's power.",
      otherOnly: true,
    },
  ],
});
