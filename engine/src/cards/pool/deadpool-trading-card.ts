import { defineCard } from "../define.js";

// Top-500 commander (rank 112). The exchange is a text-changing effect
// (rule 612.5, layer 3): "As Deadpool enters" is a replacement (614.1c), so
// the choice is made before it moves and it enters already holding the other
// creature's rules text, which then has his — the upkeep life loss and the
// sacrifice ability go to whoever controls that creature. Name, cost, colors,
// types and P/T stay put (`GameObject.textFrom`).
//
// "Each other player" is each opponent (Words of Wisdom's note): the engine
// has no teams.
const UPKEEP = "At the beginning of your upkeep, you lose 3 life.";
const SACRIFICE = "{3}, Sacrifice this creature: Each other player draws a card.";

export default defineCard({
  name: "Deadpool, Trading Card",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Mercenary", "Hero"],
  power: 5,
  toughness: 3,
  text: `As Deadpool enters, you may exchange his text box and another creature's.\n${UPKEEP}\n${SACRIFICE}`,
  exchangeTextOnEnter: { type: "creature" },
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "lose-life", amount: 3, who: "you" },
      resolve: null,
      text: UPKEEP,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-opponent" },
      resolve: null,
      text: SACRIFICE,
    },
  ],
});
