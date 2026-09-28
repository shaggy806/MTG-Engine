import { defineCard } from "../define.js";
import { mobilize } from "../helpers.js";

// During your end step the Warriors can't be sacrificed, so mobilize's own
// "sacrifice them at the beginning of the next end step" finds nothing it can
// sacrifice, and they stay for good (rule 701.21a).
const MOBILIZE_TEXT =
  "Mobilize 2 (Whenever this creature attacks, create two tapped and attacking 1/1 red Warrior creature tokens. Sacrifice them at the beginning of the next end step.)";
const STATIC_TEXT = "During your end step, Warrior tokens you control have \"This token can't be sacrificed.\"";

export default defineCard({
  name: "Zurgo, Thunder's Decree",
  manaCost: "{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Orc", "Warrior"],
  power: 2,
  toughness: 4,
  text: `${MOBILIZE_TEXT}\n${STATIC_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Warrior", token: true, controlledBy: "you" } },
      condition: {
        kind: "all",
        of: [{ kind: "your-turn" }, { kind: "turn-structure", steps: ["end"] }],
      },
      cantBeSacrificed: true,
      text: STATIC_TEXT,
    },
  ],
  triggered: [mobilize(2)],
});
