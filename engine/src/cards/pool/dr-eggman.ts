import { defineCard } from "../define.js";

// #179 in top-commanders.txt.
//
// A villainous choice (rule 701.56): each opponent in turn must pick one,
// and the one picked is Dr. Eggman's controller's effect — "that player"
// discarding, or you putting one of those cards from your hand onto the
// battlefield (a "you may", so up to one).
const TRIGGER_TEXT =
  "At the beginning of your end step, draw a card. Then each opponent faces a villainous choice — " +
  "That player discards a card, or you may put a Construct, Robot, or Vehicle card from your hand " +
  "onto the battlefield.";

export default defineCard({
  name: "Dr. Eggman",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scientist"],
  power: 3,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "each-player-may",
            who: "each-opponent",
            choices: [
              {
                text: "That player discards a card.",
                effect: { kind: "discard", target: "that-player", amount: 1 },
              },
              {
                text: "You may put a Construct, Robot, or Vehicle card from your hand onto the battlefield.",
                effect: {
                  kind: "look-and-choose",
                  zone: "hand",
                  min: 0,
                  max: 1,
                  destination: "battlefield",
                  leftover: "stay",
                  filter: { subtypes: ["Construct", "Robot", "Vehicle"] },
                },
              },
            ],
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
