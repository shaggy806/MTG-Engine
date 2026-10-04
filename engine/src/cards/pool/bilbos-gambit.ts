import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// EDHREC rank 5944.
//
// Rulings:
//   [2026-06-29] As an additional cost to cast a spell with gift, you can promise the listed gift
//     to an opponent. That opponent is chosen as part of that additional cost. The gift isn't
//     given at this time; rather, it's given at a later time based on whether or not the spell is
//     a permanent spell.
//   [2026-06-29] If a spell for which the gift was promised is countered, doesn't resolve (perhaps
//     because all of its targets are illegal), or is otherwise removed from the stack, the gift
//     won't be given. None of its other effects will happen either.
//   [2026-06-29] "Gift a Treasure" causes the chosen opponent to create a Treasure token.
//   [2026-06-29] If you copy a spell for which the gift was promised, the gift was also promised
//     to the same player for the copy. If a card or token enters as a copy of a permanent that's
//     already on the battlefield, the gift isn't promised for that new permanent, even if it was
//     promised for the original.
//   [2026-06-29] For instants and sorceries with gift, the gift is given to the appropriate
//     opponent as part of the resolution of the spell. This happens before any of the spell's
//     other effects would take place.
//   [2026-06-29] You can't pay a gift cost more than once.
//
// Gift (rule 702.174): promising it is the kicked variant, Dawn's Truce's
// shape — the Treasure first (702.174j), then Take It Back's return, then
// Silence's prohibition for every player. With its target gone it doesn't
// resolve, so no gift and no prohibition (the ruling).
const RETURN_TEXT =
  "Return target spell to its owner's hand. If the gift was promised, players can't cast spells this turn.";

export default defineCard({
  name: "Bilbo's Gambit",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: `Gift a Treasure (You may promise an opponent a gift as you cast this spell. If you do, they create a Treasure token before its other effects. It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")\n${RETURN_TEXT}`,
  targets: ["spell"],
  effect: { kind: "return-to-hand", target: 0, from: "stack" },
  kicker: {
    ...GIFT_KICKER,
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "treasure" },
        { kind: "return-to-hand", target: 0, from: "stack" },
        { kind: "prohibit", who: "each-player", spells: true },
      ],
    },
  },
});
