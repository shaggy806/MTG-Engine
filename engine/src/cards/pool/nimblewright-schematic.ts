import { defineCard } from "../define.js";

// EDHREC rank 6306.
// Makes Construct → "Construct Token (Jan Jansen, Chaos Crafter)" (a plain 1/1 colorless
// Construct artifact creature). Ichor Wellspring's two-trigger shape.

const TEXT =
  "When this artifact enters or is put into a graveyard from the battlefield, create a 1/1 colorless Construct artifact creature token.";
const TOKEN = { kind: "create-token", token: "Construct Token (Jan Jansen, Chaos Crafter)", count: 1 } as const;

export default defineCard({
  name: "Nimblewright Schematic",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: TOKEN,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: TOKEN,
      resolve: null,
      text: TEXT,
    },
  ],
});
