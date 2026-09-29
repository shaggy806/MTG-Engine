import { defineCard } from "../define.js";

export default defineCard({
  name: "Persist",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Return target nonlegendary creature card from your graveyard to the battlefield with a -1/-1 counter on it.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature", notSupertype: "legendary" } }],
  effect: { kind: "put-onto-battlefield", target: 0, withCounters: { kind: "-1/-1", amount: 1 } },
});
