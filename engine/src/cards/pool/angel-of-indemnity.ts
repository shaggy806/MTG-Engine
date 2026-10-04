import { defineCard } from "../define.js";

// EDHREC rank 3261.
//
// Rulings:
//   [2024-04-12] If one of the tokens can't attack for any reason (such as being tapped), then it
//     doesn't attack. If there's a cost associated with having it attack, you aren't forced to pay
//     that cost, so it doesn't have to attack in that case either.
//   [2024-04-12] If you return an Aura this way, you choose what the Aura will enchant just before
//     it enters the battlefield. An Aura returning to the battlefield this way doesn't target the
//     player or permanent it will enchant, so permanents or players with hexproof may be chosen;
//     however, the chosen recipient must be able to legally be enchanted by the Aura, so a player
//     or permanent with protection from one of the Aura's qualities can't be chosen this way. If
//     there's nothing legal for the Aura to enchant, it stays in the graveyard.
//   [2024-04-12] If the mana cost of a card in your graveyard includes {X}, X is 0 for the purpose
//     of determining its mana value.
//   [2024-04-12] A permanent card is an artifact, battle, creature, enchantment, land, or
//     planeswalker card.
//   [2024-04-12] Each token must attack the appropriate player if able.
//   [2024-04-12] If an effect stops a token from attacking a specific player, that token can
//     attack any player, planeswalker, or battle, or not attack at all. If the effect stops the
//     token from attacking a specific player unless a cost is paid, you don't have to pay that
//     cost unless you want to attack that player.
//   [2024-04-12] The tokens copy only what's on the original card. Effects that modified that
//     creature when it was previously on the battlefield won't be copied.
//   [2024-04-12] Opponents who have left the game aren't counted when determining how many tokens
//     to create.
//   [2024-04-12] If one of the tokens somehow is under another player's control as the delayed
//     triggered ability resolves, you can't sacrifice that token. It remains on the battlefield
//     indefinitely, even if you regain control of it later.
//   [2024-04-12] Exiling the card with encore is a cost to activate the ability. Once you announce
//     that you're activating it, no player may take actions until you've finished. They can't try
//     to remove the card from your graveyard to stop you from paying the cost.

export default defineCard({
  name: "Angel of Indemnity",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel", "Warrior"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "lifelink"],
  text: "Flying, lifelink\nWhen this creature enters, return target permanent card with mana value 4 or less from your graveyard to the battlefield.\nEncore {6}{W}{W} ({6}{W}{W}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Sun Titan's shape without its "you may": the target is mandatory.
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { notTypes: ["instant", "sorcery"], manaValue: { op: "lte", n: 4 } },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: "When this creature enters, return target permanent card with mana value 4 or less from your graveyard to the battlefield.",
    },
  ],
  activated: [
    {
      // Encore's cost exiles this card from the graveyard — `zone:
      // "graveyard"` makes that the implicit cost (Rakshasa Debaser's shape).
      cost: { mana: "{6}{W}{W}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {6}{W}{W} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
