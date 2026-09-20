import { defineCard } from "../define.js";

export default defineCard({
  name: "Contentious Plan",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Proliferate.\nDraw a card.",
  // The draw is proliferate's `then`, not the second step of a `sequence`: a
  // sequence runs synchronously, so the card would draw before the "choose
  // any number" decision came back.
  effect: { kind: "proliferate", then: { kind: "draw", amount: 1 } },
});
