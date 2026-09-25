import { defineCard } from "../define.js";

// #216 in top-commanders.txt.
const PT_TEXT = "Umbris gets +1/+1 for each card your opponents own in exile.";
const EXILE_TEXT =
  "Whenever Umbris or another Nightmare or Horror you control enters, target opponent exiles cards " +
  "from the top of their library until they exile a land card.";

export default defineCard({
  name: "Umbris, Fear Manifest",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Nightmare", "Horror"],
  power: 1,
  toughness: 1,
  text: `${PT_TEXT}\n${EXILE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { exiled: { ownedBy: "opponent" }, pt: [1, 1] },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      // Umbris is a Nightmare Horror, so "Umbris or another" is every one.
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtypes: ["Nightmare", "Horror"] } },
      targets: ["opponent"],
      effect: { kind: "reveal-until", whose: 0, filter: { type: "land" }, exile: true, rest: "stay" },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
