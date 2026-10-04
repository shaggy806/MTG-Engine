import { defineCard } from "../define.js";

// EDHREC rank 5709.
//
// Rulings:
//   [2025-11-17] Exiling the card with encore is a cost to activate the encore ability. Once you
//     announce that you're activating it, no player may take actions until you've finished. They
//     can't try to remove the card from your graveyard to stop you from paying the cost.
//   [2025-11-17] Encore is an activated ability that functions from the graveyard. "Encore [cost]"
//     means "[Cost], Exile this card from your graveyard: For each opponent, create a token that's
//     a copy of this card that attacks that opponent this turn if able. The tokens gain haste.
//     Sacrifice them at the beginning of the next end step. Activate only as a sorcery."
//   [2025-11-17] If one of the tokens can't attack for any reason (such as being tapped), then it
//     doesn't attack. If there's a cost associated with having it attack, you aren't forced to pay
//     that cost, so it doesn't have to attack in that case either.
//   [2025-11-17] If an effect stops a token from attacking a specific player, that token can
//     attack any player, planeswalker, or battle, or not attack at all. If the effect stops the
//     token from attacking a specific player unless a cost is paid, you don't have to pay that
//     cost unless you want to attack that player.
//   [2025-11-17] Opponents who have left the game aren't counted when determining how many tokens
//     to create.
//   [2025-11-17] If one of the tokens somehow is under another player's control as the delayed
//     triggered ability resolves, you can't sacrifice that token. It remains on the battlefield
//     indefinitely, even if you regain control of it later.
//   [2025-11-17] Each token must attack the appropriate player if able.
//   [2025-11-17] The tokens copy only what's on the original card. Effects that modified that
//     creature when it was previously on the battlefield won't be copied.

const youControlCreatures = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Jubilation",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Incarnation"],
  power: 5,
  toughness: 5,
  text: "When this creature enters, creatures you control get +2/+2 and gain trample until end of turn.\nEncore {7}{G}{G} ({7}{G}{G}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: youControlCreatures, power: 2, toughness: 2, duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: youControlCreatures, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "When this creature enters, creatures you control get +2/+2 and gain trample until end of turn.",
    },
  ],
  activated: [
    {
      // Encore's cost exiles this card from the graveyard — `zone:
      // "graveyard"` makes that the implicit cost (Rakshasa Debaser's shape).
      cost: { mana: "{7}{G}{G}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {7}{G}{G} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
