import { defineCard } from "../define.js";

// EDHREC rank 6157.

export default defineCard({
  name: "Scale the Heights",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Put a +1/+1 counter on up to one target creature. You gain 2 life. You may play an additional land this turn.\nDraw a card.",
  targets: [{ kind: "optional", of: "creature" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "gain-life", amount: 2 },
      { kind: "additional-land-drop", amount: 1 },
      { kind: "draw", amount: 1 },
    ],
  },
});
