import { defineCard } from "../define.js";

// EDHREC rank 4056.
//
// Rulings:
//   [2020-11-10] To have two commanders, both must have the partner ability as the game begins.
//     Losing the ability during the game doesn't cause either to cease to be your commander.
//   [2020-11-10] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to a commander you control may become lethal if Anara
//     leaves the battlefield during that turn.
//   [2020-11-10] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won't have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 damage from any one of them, not from both of them
//     combined.
//   [2020-11-10] Anara's first ability affects commanders you control even if you don't own them.
//     It doesn't affect your commander if another player controls it.
//   [2020-11-10] If your Commander deck has two commanders, you can only include cards whose own
//     color identities are also found in your commanders' combined color identities. If Falthis
//     and Kediss are your commanders, your deck may contain cards with black and/or red in their
//     color identity, but not cards with green, white, or blue.
//   [2020-11-10] Both commanders start in the command zone, and the remaining 98 cards (or 58
//     cards in a Commander Draft game) of your deck are shuffled to become your library.
//   [2020-11-10] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.
//   [2020-11-10] If Anara is your commander, its first ability affects itself during your turn.
//   [2020-11-10] If something refers to your commander while you have two commanders, it refers to
//     one of them of your choice. If you are instructed to perform an action on your commander
//     (e.g. put it from the command zone into your hand due to Command Beacon), you choose one of
//     your commanders at the time the effect happens.
//   [2020-11-10] You can choose two commanders with partner that are the same color or colors. In
//     Commander Draft, you can even choose two of the same commander with partner if you drafted
//     them. If you do this, make sure you keep the number of times you've cast each from the
//     command zone clear for "commander tax" purposes.

export default defineCard({
  name: "Anara, Wolvid Familiar",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Wolf", "Beast"],
  power: 4,
  toughness: 4,
  pairing: { kind: "partner" },
  text: "During your turn, commanders you control have indestructible. (Effects that say \"destroy\" don't destroy them. A creature with indestructible can't be destroyed by damage.)\nPartner (You can have two commanders if both have partner.)",
  static: [
    {
      // Any commander you control, owned or not, of any card type (the rulings).
      affects: { scope: "filter", filter: { isCommander: true, controlledBy: "you" } },
      condition: { kind: "your-turn" },
      grantKeywords: ["indestructible"],
      text: "During your turn, commanders you control have indestructible.",
    },
  ],
});
