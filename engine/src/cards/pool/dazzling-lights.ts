import { defineCard } from "../define.js";

export default defineCard({
  name: "Dazzling Lights",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gets -3/-0 until end of turn.\nSurveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -3, toughness: 0, duration: "end-of-turn" },
      { kind: "surveil", amount: 2 },
    ],
  },
});
