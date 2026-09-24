import { defineCard } from "../define.js";

// - The enters trigger is Growth Spiral's shape — a draw, then a
//   `look-and-choose` over your hand (`min: 0` is the "you may") — with the
//   Cave clause as its `then`, which only runs if a land was put down and
//   reads that land as target 0.
// - "Lands you control enter untapped" is The Wandering Minstrel's
//   `others-enter-battlefield` replacement: it beats a land's own "enters
//   tapped" (you order the two), and doesn't reach a land entering at the
//   same time as Spelunking. It does reach the land its own trigger puts
//   down, which enters after Spelunking is already on the battlefield.
const ETB_TEXT =
  "When this enchantment enters, draw a card, then you may put a land card from your hand " +
  "onto the battlefield. If you put a Cave onto the battlefield this way, you gain 4 life.";
const LANDS_TEXT = "Lands you control enter untapped.";

export default defineCard({
  name: "Spelunking",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${ETB_TEXT}\n${LANDS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "look-and-choose",
            zone: "hand",
            min: 0,
            max: 1,
            destination: "battlefield",
            leftover: "stay",
            filter: { type: "land" },
            then: {
              kind: "conditional",
              condition: { kind: "target", index: 0, filter: { subtype: "Cave" } },
              then: { kind: "gain-life", amount: 4 },
            },
          },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "land", controlledBy: "you" },
        untapped: true,
      },
      text: LANDS_TEXT,
    },
  ],
});
