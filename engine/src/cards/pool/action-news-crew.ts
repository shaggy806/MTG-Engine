import { defineCard } from "../define.js";

export default defineCard({
  name: "Action News Crew",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Citizen"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance\nChannel — {6}, Discard this card: Put a +1/+1 counter on each creature you control. Draw a card.",
  activated: [
    {
      cost: { mana: "{6}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "add-counter-all",
            filter: { type: "creature", controlledBy: "you" },
            counter: "+1/+1",
            amount: 1,
          },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: "Channel — {6}, Discard this card: Put a +1/+1 counter on each creature you control. Draw a card.",
      zone: "hand",
    },
  ],
});
