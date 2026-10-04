import { defineCard } from "../define.js";

// EDHREC rank 5984.
//
// Rulings:
//   [2017-09-29] The returned creature won’t be the target of any spells or abilities that
//     targeted it before. Any spells that don’t target it, such as Star of Extinction, will still
//     affect it.
//   [2017-09-29] You’ll draw a card if the creature was a Pirate as it was exiled, even if it
//     doesn’t return to the battlefield (most likely because it’s a token) or if it returns to the
//     battlefield but isn’t a Pirate anymore (most likely because it’s copying something else).
//   [2017-09-29] If a token is exiled this way, it will cease to exist and won’t return to the
//     battlefield.
//   [2017-09-29] Once the exiled creature returns, it’s considered a new object with no relation
//     to the object that it was. Auras attached to the exiled creature will be put into their
//     owners’ graveyards. Equipment attached to the exiled creature will become unattached and
//     remain on the battlefield. Any counters on the exiled creature will cease to exist.

//
// "If a Pirate was exiled this way" is asked of the creature as it is exiled
// (the second ruling): a token Pirate still draws, and one that returns as
// something else still draws. Nothing happens between the check and the exile,
// so the target is checked just before the flicker, and the draw follows the
// return as printed.
const FLICKER = { kind: "flicker", target: 0 } as const;

export default defineCard({
  name: "Siren's Ruse",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile target creature you control, then return that card to the battlefield under its owner's control. If a Pirate was exiled this way, draw a card.",
  targets: ["creature-you-control"],
  effect: {
    kind: "conditional",
    condition: { kind: "target", index: 0, filter: { subtype: "Pirate" } },
    then: { kind: "sequence", effects: [FLICKER, { kind: "draw", amount: 1 }] },
    else: FLICKER,
  },
});
