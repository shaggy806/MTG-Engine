import { defineCard } from "../define.js";

// EDHREC rank 6720. Lesson is a spell subtype with no rules of its own (its
// ruling); Deliberate's shape.

export default defineCard({
  name: "Introduction to Prophecy",
  manaCost: "{3}",
  colors: [],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Scry 2, then draw a card.",
  effect: { kind: "scry", amount: 2, then: { kind: "draw", amount: 1 } },
});
