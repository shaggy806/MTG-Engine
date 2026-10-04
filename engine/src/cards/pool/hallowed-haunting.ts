import { defineCard } from "../define.js";

// EDHREC rank 3171.

const ANTHEM_TEXT =
  "As long as you control seven or more enchantments, creatures you control have flying and vigilance.";
const TOKEN_TEXT =
  "Whenever you cast an enchantment spell, create a white Spirit Cleric creature token with \"This token's power and toughness are each equal to the number of Spirits you control.\"";

export default defineCard({
  name: "Hallowed Haunting",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ANTHEM_TEXT}\n${TOKEN_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      // Hallowed Haunting is one of the seven.
      condition: { kind: "controls", filter: { type: "enchantment" }, atLeast: 7, countsSelf: true },
      grantKeywords: ["flying", "vigilance"],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Cleric Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
