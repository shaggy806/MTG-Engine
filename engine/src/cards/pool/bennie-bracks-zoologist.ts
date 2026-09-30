import { defineCard } from "../define.js";

const TEXT = "At the beginning of each end step, if you created a token this turn, draw a card.";

export default defineCard({
  name: "Bennie Bracks, Zoologist",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 2,
  convoke: true,
  text:
    "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\n" +
    TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "created-token-this-turn" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
