import { defineCard } from "../define.js";

const CYCLE_TEXT =
  "When you cycle this card, put two +1/+1 counters on up to one target creature or Vehicle. It gains trample and " +
  "indestructible until end of turn.";

// The cycle trigger targets as it goes on the stack, above the cycling
// ability, and resolves before its draw. A Vehicle that isn't a creature
// still gets the counters and the keywords (they matter once it's crewed
// this turn).
export default defineCard({
  name: "Agonasaur Rex",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 8,
  toughness: 8,
  keywords: ["trample"],
  cycling: { cost: "{2}{G}" },
  text: `Trample\nCycling {2}{G} ({2}{G}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cycled" },
      targets: [
        {
          kind: "optional",
          of: { kind: "permanent", filter: { anyOf: [{ type: "creature" }, { subtype: "Vehicle" }] } },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
