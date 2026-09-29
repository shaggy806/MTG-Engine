import { defineCard } from "../define.js";

const BOUNCE_TEXT = "When this land enters, return a land you control to its owner's hand.";

// A choice as it resolves, not a target; with no other land it returns
// itself (the ruling).
export default defineCard({
  name: "Guildless Commons",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n${BOUNCE_TEXT}\n{T}: Add {C}{C}.`,
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
        kind: "choose-permanents",
        filter: { type: "land", controlledBy: "you" },
        min: 1,
        upTo: 1,
        then: { kind: "return-to-hand", target: 0 },
        prompt: "Return a land you control to its owner's hand",
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
