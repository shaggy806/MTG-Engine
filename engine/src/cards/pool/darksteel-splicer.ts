import { defineCard } from "../define.js";

// EDHREC rank 6744.
//
// Ruling: damage stays marked, so nonlethal damage on a Golem may become
// lethal if the Splicer leaves later that turn — the indestructible is a
// plain static, gone as it leaves.

const ENTER_TEXT =
  "Whenever this creature or another nontoken Phyrexian you control enters, create X 3/3 colorless Phyrexian " +
  "Golem artifact creature tokens, where X is the number of opponents you have.";
const LORD_TEXT = "Golems you control have indestructible.";

const GOLEMS = {
  kind: "create-token",
  token: "Phyrexian Golem Token",
  count: { countPlayers: "each-opponent" },
} as const;

// "This creature" counts even as a token copy; the others must be nontoken
// Phyrexians — two triggers for the two halves (Pawn of Ulamog's shape), and
// one entry fires one. X is counted as it resolves (Chittering Witch).
export default defineCard({
  name: "Darksteel Splicer",
  manaCost: "{6}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Artificer"],
  power: 1,
  toughness: 1,
  text: `${ENTER_TEXT}\n${LORD_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: GOLEMS,
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Phyrexian", token: false },
        otherOnly: true,
      },
      targets: [],
      effect: GOLEMS,
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      // Blade Splicer's Golem lord, with indestructible.
      affects: { scope: "creatures-you-control", subtype: "Golem" },
      grantKeywords: ["indestructible"],
      text: LORD_TEXT,
    },
  ],
});
