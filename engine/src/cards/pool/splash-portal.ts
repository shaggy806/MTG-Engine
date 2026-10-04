import { defineCard } from "../define.js";

// EDHREC rank 3092.
//
// Rulings:
//   [2024-07-26] In the case where the exiled permanent returns with different creature types than
//     it had when it left the battlefield (for example, if the target creature was copying
//     something else when Splash Portal began to resolve), Splash Portal will check its creature
//     types as it exists after returning to the battlefield. If it’s a Bird, Frog, Otter, or Rat
//     at that point, you’ll draw a card.
//   [2024-07-26] Once the exiled permanent returns, it’s considered a new object with no relation
//     to the object that it was. Auras attached to the exiled permanent will be put into their
//     owners’ graveyards. Equipment attached to the exiled permanent will become unattached and
//     remain on the battlefield. Any counters on the exiled permanent will cease to exist.
//   [2024-07-26] If a token is exiled this way, it will cease to exist and won’t return to the
//     battlefield. You won’t draw a card even if it was a Bird, Frog, Otter, or Rat.

export default defineCard({
  name: "Splash Portal",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Exile target creature you control, then return it to the battlefield under its owner's control. If that creature is a Bird, Frog, Otter, or Rat, draw a card.",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "flicker", target: 0 },
      // Read off the permanent that returned, as it is now (the first ruling);
      // a token never returns, so it draws nothing (the third).
      {
        kind: "conditional",
        condition: {
          kind: "this-way",
          what: "put-onto-battlefield",
          filter: { subtypes: ["Bird", "Frog", "Otter", "Rat"] },
        },
        then: { kind: "draw", amount: 1 },
      },
    ],
  },
});
