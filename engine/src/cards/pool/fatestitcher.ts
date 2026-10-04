import { defineCard } from "../define.js";
import { unearth } from "../helpers.js";

// EDHREC rank 6414.
//
// Rulings:
//   [2008-10-01] If you activate a card’s unearth ability but that card is removed from your
//     graveyard before the ability resolves, that unearth ability will resolve and do nothing.
//   [2008-10-01] Unearth grants haste to the creature that’s returned to the battlefield. However,
//     neither of the “exile” abilities is granted to that creature. If that creature loses all its
//     abilities, it will still be exiled at the beginning of the end step, and if it would leave
//     the battlefield, it is still exiled instead.
//   [2008-10-01] If a creature returned to the battlefield with unearth would leave the
//     battlefield for any reason, it’s exiled instead — unless the spell or ability that’s causing
//     the creature to leave the battlefield is actually trying to exile it! In that case, it
//     succeeds at exiling it. If it later returns the creature card to the battlefield (as
//     Oblivion Ring or Flickerwisp might, for example), the creature card will return to the
//     battlefield as a new object with no relation to its previous existence. The unearth effect
//     will no longer apply to it.
//   [2008-10-01] Activating a creature card’s unearth ability isn’t the same as casting the
//     creature card. The unearth ability is put on the stack, but the creature card is not. Spells
//     and abilities that interact with activated abilities (such as Stifle) will interact with
//     unearth, but spells and abilities that interact with spells (such as Remove Soul) will not.
//   [2008-10-01] At the beginning of the end step, a creature returned to the battlefield with
//     unearth is exiled. This is a delayed triggered ability, and it can be countered by effects
//     such as Stifle or Voidslime that counter triggered abilities. If the ability is countered,
//     the creature will stay on the battlefield and the delayed trigger won’t trigger again.
//     However, the replacement effect will still exile the creature when it eventually leaves the
//     battlefield.

const TAP_TEXT = "{T}: You may tap or untap another target permanent.";

export default defineCard({
  name: "Fatestitcher",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 1,
  toughness: 2,
  text: `${TAP_TEXT}\nUnearth {U} ({U}: Return this card from your graveyard to the battlefield. It gains haste. Exile it at the beginning of the next end step or if it would leave the battlefield. Unearth only as a sorcery.)`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "other", of: "permanent" }],
      // "You may tap or untap": Merrow Reejerey's optional mode pick.
      effect: {
        kind: "modal",
        minModes: 0,
        maxModes: 1,
        modes: [
          { text: "Tap that permanent.", effect: { kind: "tap", target: 0 } },
          { text: "Untap that permanent.", effect: { kind: "untap", target: 0 } },
        ],
      },
      resolve: null,
      text: TAP_TEXT,
    },
    unearth("{U}"),
  ],
});
