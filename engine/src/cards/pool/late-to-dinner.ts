import { defineCard } from "../define.js";

export default defineCard({
  name: "Late to Dinner",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return target creature card from your graveyard to the battlefield. Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "put-onto-battlefield", target: 0 },
      { kind: "create-token", token: "Food Token", count: 1 },
    ],
  },
});
