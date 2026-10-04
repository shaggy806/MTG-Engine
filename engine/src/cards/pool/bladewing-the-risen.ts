import { defineCard } from "../define.js";

// EDHREC rank 3725.
//
// "Dragon permanent card": a Dragon card that isn't an instant or sorcery
// (Quarry Beetle's shape for the return). "Dragon creatures get +1/+1" is
// every Dragon creature, whoever controls it.

const RETURN_TEXT =
  "When Bladewing enters, you may return target Dragon permanent card from your graveyard to the battlefield.";
const PUMP_TEXT = "{B}{R}: Dragon creatures get +1/+1 until end of turn.";

export default defineCard({
  name: "Bladewing the Risen",
  manaCost: "{3}{B}{B}{R}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${RETURN_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        { kind: "card-in-graveyard", whose: "you", filter: { subtype: "Dragon", notTypes: ["instant", "sorcery"] } },
      ],
      effect: {
        kind: "may",
        prompt: "Return target Dragon permanent card from your graveyard to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{B}{R}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", subtype: "Dragon" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
