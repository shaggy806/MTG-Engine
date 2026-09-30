import { defineCard } from "../define.js";

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, put a +1/+1 counter on this creature.";
const RETURN_TEXT = "{G}, Discard a creature card: Return target land card from your graveyard to the battlefield tapped.";

export default defineCard({
  name: "Floral Evoker",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Druid"],
  power: 2,
  toughness: 3,
  text: `${LANDFALL_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{G}", tap: false, discard: { count: 1, filter: { type: "creature" } } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
