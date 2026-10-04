import { defineCard } from "../define.js";

// EDHREC rank 5943.
//
// Rulings:
//   [2025-11-17] Since you are using an alternative cost to cast the spell, you can't pay any
//     other alternative costs. You can, however, pay additional costs, such as kicker costs. If
//     the card has any mandatory additional costs, you must pay those.
//   [2025-11-17] If you choose to cast the instant or sorcery card, you do so while Impulsivity's
//     first ability is resolving and still on the stack. You can't wait to cast it later in the
//     turn. Timing restrictions based on the card's type are ignored.
//   [2025-11-17] The tokens copy only what's on the original card. Effects that modified that
//     creature when it was previously on the battlefield won't be copied.
//   [2025-11-17] Opponents who have left the game aren't counted when determining how many tokens
//     to create.
//   [2025-11-17] If the spell you cast has {X} in its mana cost, you must choose 0 as the value of
//     X when casting it without paying its mana cost.
//   [2025-11-17] Exiling the card with encore is a cost to activate the encore ability. Once you
//     announce that you're activating it, no player may take actions until you've finished. They
//     can't try to remove the card from your graveyard to stop you from paying the cost.
//   [2025-11-17] If one of the tokens somehow is under another player's control as the delayed
//     triggered ability resolves, you can't sacrifice that token. It remains on the battlefield
//     indefinitely, even if you regain control of it later.
//   [2025-11-17] If one of the tokens can't attack for any reason (such as being tapped), then it
//     doesn't attack. If there's a cost associated with having it attack, you aren't forced to pay
//     that cost, so it doesn't have to attack in that case either.
//   [2025-11-17] Encore is an activated ability that functions from the graveyard. "Encore [cost]"
//     means "[Cost], Exile this card from your graveyard: For each opponent, create a token that's
//     a copy of this card that attacks that opponent this turn if able. The tokens gain haste.
//     Sacrifice them at the beginning of the next end step. Activate only as a sorcery."
//   [2025-11-17] Each token must attack the appropriate player if able.
//   [2025-11-17] If an effect stops a token from attacking a specific player, that token can
//     attack any player, planeswalker, or battle, or not attack at all. If the effect stops the
//     token from attacking a specific player unless a cost is paid, you don't have to pay that
//     cost unless you want to attack that player.
//
// Torrential Gearhulk's free `cast-now` with Diluvian Primordial's reach into
// any graveyard ("exile it instead" whoever owns it); encore is Phyrexian
// Triniform's graveyard ability.
const ETB_TEXT =
  "When this creature enters, you may cast target instant or sorcery card from a graveyard without paying its mana cost. If that spell would be put into a graveyard, exile it instead.";
const ENCORE_TEXT =
  "Encore {7}{R}{R} ({7}{R}{R}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)";

export default defineCard({
  name: "Impulsivity",
  manaCost: "{6}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Incarnation"],
  power: 7,
  toughness: 5,
  text: `${ETB_TEXT}\n${ENCORE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "any", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: { kind: "cast-now", target: 0, free: true, exileAfter: true },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{7}{R}{R}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {7}{R}{R} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
