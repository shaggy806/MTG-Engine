import { defineCard } from "../define.js";

const TEXT =
  "Whenever your opponents are dealt combat damage, if any of that damage was dealt by a Warrior, you draw a card and you lose 1 life.";

// Once for each combat damage step in which a Warrior — anyone's — dealt
// combat damage to one or more of your opponents.
export default defineCard({
  name: "Mindblade Render",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Azra", "Warrior"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "any",
        filter: { subtype: "Warrior" },
        to: "opponent",
        combat: true,
        once: "per-event",
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1, who: "you" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
