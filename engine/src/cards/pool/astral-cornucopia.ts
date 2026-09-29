import { defineCard } from "../define.js";

const MANA_TEXT = "{T}: Choose a color. Add one mana of that color for each charge counter on this artifact.";

export default defineCard({
  name: "Astral Cornucopia",
  manaCost: "{X}{X}{X}",
  colors: [],
  types: ["artifact"],
  text: `This artifact enters with X charge counters on it.\n${MANA_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "charge", amount: "x" } },
      text: "This artifact enters with X charge counters on it.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: { countersOn: "source", counter: "charge" } },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
