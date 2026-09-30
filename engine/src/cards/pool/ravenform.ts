import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravenform",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  foretell: { cost: "{U}" },
  text:
    "Exile target artifact or creature. Its controller creates a 1/1 blue Bird creature token with flying.\n" +
    "Foretell {U} (During your turn, you may pay {2} and exile this card from your hand face down. Cast it on a later turn for its foretell cost.)",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "creature"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "create-token", token: "1/1 Blue Bird Token", count: 1, who: "target-controller" },
    ],
  },
});
