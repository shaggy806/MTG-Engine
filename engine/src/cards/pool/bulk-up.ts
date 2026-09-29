import { defineCard } from "../define.js";

export default defineCard({
  name: "Bulk Up",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Double target creature's power until end of turn.\n" +
    "Flashback {4}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  flashback: { cost: "{4}{R}{R}" },
  targets: ["creature"],
  effect: {
    kind: "modify-pt",
    target: 0,
    power: { powerOf: 0, doubling: true },
    toughness: 0,
    duration: "end-of-turn",
  },
});
