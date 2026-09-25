import { defineCard } from "../define.js";

export default defineCard({
  name: "Fungal Infection",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -1/-1 until end of turn. Create a 1/1 green Saproling creature token.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      { kind: "create-token", token: "Saproling Token", count: 1 },
    ],
  },
});
