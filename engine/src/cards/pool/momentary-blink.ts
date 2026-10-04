import { defineCard } from "../define.js";

// EDHREC rank 2731.
//
// Rulings:
//   [2021-03-19] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.
//   [2021-03-19] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2021-03-19] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2021-03-19] "Flashback [cost]" means "You may cast this card from your graveyard by paying
//     [cost] rather than paying its mana cost" and "If the flashback cost was paid, exile this
//     card instead of putting it anywhere else any time it would leave the stack."
//   [2021-03-19] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2021-03-19] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.
//   [2022-12-08] When the card returns to the battlefield, it will be a new object with no
//     connection to the card that was exiled. Auras attached to the exiled creature will be put
//     into their owners' graveyards. Any Equipment will become unattached and remain on the
//     battlefield. Any counters on the exiled creature will cease to exist.
//   [2022-12-08] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.

export default defineCard({
  name: "Momentary Blink",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  flashback: { cost: "{3}{U}" },
  text: "Exile target creature you control, then return it to the battlefield under its owner's control.\nFlashback {3}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["creature-you-control"],
  effect: { kind: "flicker", target: 0 },
});
