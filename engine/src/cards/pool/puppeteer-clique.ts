import { defineCard } from "../define.js";
import { persist } from "../helpers.js";

// EDHREC rank 2586.
//
// Rulings (persist):
//   [2013-06-07] When a permanent with persist returns to the battlefield, it's a new object with
//     no memory of or connection to its previous existence.
//   [2013-06-07] If a creature with persist that has +1/+1 counters on it receives enough -1/-1
//     counters to cause it to be destroyed by lethal damage or put into its owner's graveyard for
//     having 0 or less toughness, persist won't trigger and the card won't return to the
//     battlefield.

const ETB_TEXT =
  "When this creature enters, put target creature card from an opponent's graveyard onto the battlefield under your control. It gains haste. At the beginning of your next end step, exile it.";

export default defineCard({
  name: "Puppeteer Clique",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${ETB_TEXT}\nPersist (When this creature dies, if it had no -1/-1 counters on it, return it to the battlefield under its owner's control with a -1/-1 counter on it.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "opponent", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0, underYourControl: true },
          // "It gains haste" has no duration: it lasts as long as it stays.
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "permanent" },
          {
            kind: "delayed-trigger",
            at: "your-next-end-step",
            // Whip of Erebos's shape: the delayed ability remembers the
            // creature as the object it is once on the battlefield, so one
            // that has left by then (a new object, rule 400.7) is left be.
            effect: { kind: "exile", target: 0 },
            text: "Exile the creature Puppeteer Clique put onto the battlefield.",
          },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
    persist(),
  ],
});
