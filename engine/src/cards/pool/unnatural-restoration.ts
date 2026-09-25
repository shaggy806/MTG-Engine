import { defineCard } from "../define.js";

export default defineCard({
  name: "Unnatural Restoration",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Return target permanent card from your graveyard to your hand. Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0, from: "graveyard" }, { kind: "proliferate" }],
  },
});
