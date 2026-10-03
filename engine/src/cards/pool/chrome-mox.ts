import { defineCard } from "../define.js";

const IMPRINT_TEXT = "Imprint — When this artifact enters, you may exile a nonartifact, nonland card from your hand.";
const MANA_TEXT = "{T}: Add one mana of any of the exiled card's colors.";

// Imprint links the two abilities (rule 607.2a): the card goes to exile face
// up, linked to this permanent in this stint, and the mana ability reads only
// that card — a colour of it, the player's pick when it has several, never
// {C}; with nothing exiled, or a colourless card, no mana at all (the
// rulings).
export default defineCard({
  name: "Chrome Mox",
  manaCost: "{0}",
  types: ["artifact"],
  text: `${IMPRINT_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "exile",
        leftover: "stay",
        filter: { notTypes: ["artifact", "land"] },
      },
      resolve: null,
      text: IMPRINT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { colorAmong: {}, zone: "exiled-with-source" }, amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
