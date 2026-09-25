import { defineCard } from "../define.js";

export default defineCard({
  name: "Emerge from the Cocoon",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return target creature card from your graveyard to the battlefield. You gain 3 life.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "put-onto-battlefield", target: 0 }, { kind: "gain-life", amount: 3 }],
  },
});
