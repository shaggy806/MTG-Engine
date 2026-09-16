import { defineCard } from "../define.js";

export default defineCard({
  name: "Zombie Apocalypse",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Return all Zombie creature cards from your graveyard to the battlefield " +
    "tapped, then destroy all Humans.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "return-from-graveyard",
        filter: { type: "creature", subtype: "Zombie" },
        destination: "battlefield",
        count: "all",
        enterTapped: true,
      },
      // "**All** Humans" — everyone's, including any you just brought back
      // that happen to be Human Zombies.
      { kind: "destroy-all", filter: { subtype: "Human" } },
    ],
  },
});
