import { defineCard } from "../define.js";

// EDHREC rank 4181.
//
// Rulings:
//   [2021-04-16] Each creature with lifelink dealing combat damage causes a separate life-gaining
//     event. For example, if two creatures you control with lifelink deal combat damage at the
//     same time, a "whenever you gain life" ability will trigger twice. However, if a single
//     creature you control with lifelink deals combat damage to multiple creatures, players,
//     and/or planeswalkers at the same time (perhaps because it has trample or was blocked by more
//     than one creature), the ability will trigger only once.
//   [2021-04-16] An ability that triggers "whenever you gain life" triggers just once for each
//     life-gaining event, no matter how much life you gain.
//   [2021-04-16] If you gain an amount of life "for each" of something, that life is gained as one
//     event and the ability will trigger only once.
//   [2021-04-16] You may only pay {B} once for each life gain event.

const TEXT =
  "Whenever you gain life, you may pay {B}. If you do, return target creature card from your graveyard to your hand.";

export default defineCard({
  name: "Veinwitch Coven",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warlock"],
  power: 3,
  toughness: 3,
  keywords: ["menace"],
  text: `Menace\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      // The target belongs to the ability (chosen as it goes on the stack),
      // as Flameblast Dragon's; the `may` only asks for the {B}.
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "may",
        prompt: "Pay {B} to return target creature card to your hand?",
        cost: "{B}",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
