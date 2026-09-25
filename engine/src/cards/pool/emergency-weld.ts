import { defineCard } from "../define.js";

export default defineCard({
  name: "Emergency Weld",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Return target artifact or creature card from your graveyard to your hand. Create a 1/1 colorless Soldier artifact creature token.",
  targets: [
    {
      kind: "card-in-graveyard",
      whose: "you",
      filter: { typesAnyOf: ["artifact", "creature"] },
    },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0, from: "graveyard" },
      { kind: "create-token", token: "Soldier Artifact Token", count: 1 },
    ],
  },
});
