import { defineCard } from "../define.js";

// EDHREC rank 4297.
//
// Rulings:
//   [2021-09-24] If some of your Zombies have first strike but others don't, or if you have a
//     Zombie with double strike, the ability will trigger twice, the first time counting the
//     number of opponents who were dealt damage in the first strike combat damage step, and the
//     second time counting the ones who were dealt damage in the second combat damage step.
//   [2021-09-24] The number of cards you discard is equal to the number of opponents that were
//     dealt combat damage by your Zombies, even if another effect changed the number of cards you
//     drew.

// The draw is Malcolm, Keen-Eyed Navigator's batched trigger: once per combat
// damage event (first-strike and regular damage are two, as the first ruling
// says), with `{ triggerValue: true }` the number of opponents dealt damage by
// Zombies you control in it. "If you do, discard that many" is the same number,
// whatever the draw became (the second ruling).
const FLYING_TEXT = "Other Zombies you control have flying.";
const DRAW_TEXT =
  "Whenever one or more Zombies you control deal combat damage to one or more of your opponents, you may draw cards equal to the number of opponents dealt damage this way. If you do, discard that many cards.";

export default defineCard({
  name: "Hordewing Skaab",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Horror"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying
${FLYING_TEXT}
${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Zombie" },
      grantKeywords: ["flying"],
      text: FLYING_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { subtype: "Zombie" },
        to: "opponent",
        combat: true,
        once: "per-event",
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw that many cards, then discard that many?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: { triggerValue: true } },
            { kind: "discard", target: "you", amount: { triggerValue: true } },
          ],
        },
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
