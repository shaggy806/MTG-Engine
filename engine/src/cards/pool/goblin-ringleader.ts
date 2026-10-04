import { defineCard } from "../define.js";

// EDHREC rank 4365.
//
// Rulings:
//   [2019-07-12] If an effect refers to a “[subtype] spell” or “[subtype] card,” it refers only to
//     a spell or card that has that subtype. For example, Goblin Gathering is a card that creates
//     Goblins and features Goblins in its illustration, but it isn’t a Goblin card.

const ENTER_TEXT =
  "When this creature enters, reveal the top four cards of your library. Put all Goblin cards revealed this way into your hand and the rest on the bottom of your library in any order.";

export default defineCard({
  name: "Goblin Ringleader",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: `Haste (This creature can attack and {T} as soon as it comes under your control.)\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // "All Goblin cards": `min` = `max` = 4 is clamped to the Goblins
      // among the four (`lookAndChoose`), so every one of them is taken.
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: true,
        min: 4,
        max: 4,
        filter: { subtype: "Goblin" },
        destination: "hand",
        leftover: "bottom-any-order",
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
