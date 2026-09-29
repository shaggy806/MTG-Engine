import { defineCard } from "../define.js";

const BOUNCE_TEXT =
  "When this land enters, return a land you control to its owner's hand. If another Desert was " +
  "returned this way, surveil 1.";

// A choice as it resolves, not a target; with no other land it returns
// itself (the ruling), which isn't "another" Desert.
export default defineCard({
  name: "Arid Archway",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text:
    `This land enters tapped.\n${BOUNCE_TEXT} (Look at the top card of your library. You may put ` +
    "it into your graveyard.)\n{T}: Add {C}{C}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "choose-permanents",
            filter: { type: "land", controlledBy: "you" },
            min: 1,
            upTo: 1,
            then: { kind: "return-to-hand", target: 0 },
            prompt: "Return a land you control to its owner's hand",
          },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "returned-to-hand", filter: { subtype: "Desert" }, other: true },
            then: { kind: "surveil", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: BOUNCE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}: Add {C}{C}.",
    },
  ],
});
