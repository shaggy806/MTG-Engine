import { defineCard } from "../define.js";

// EDHREC rank 5455.

export default defineCard({
  name: "Irregular Cohort",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 2,
  toughness: 2,
  keywords: ["changeling"],
  text: "Changeling (This card is every creature type.)\nWhen this creature enters, create a 2/2 colorless Shapeshifter creature token with changeling.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Shapeshifter Token (Irregular Cohort)", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 2/2 colorless Shapeshifter creature token with changeling.",
    },
  ],
});
