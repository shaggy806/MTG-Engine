import { defineCard } from "../define.js";

const COST_TEXT = "This spell costs {1} less to cast for each land card in your graveyard.";
const SAC_TEXT = "Whenever Yuma enters or attacks, you may sacrifice a land. If you do, draw a card.";
const DESERT_TEXT =
  "Whenever a Desert card is put into your graveyard from anywhere, create a 4/2 green Plant Warrior " +
  "creature token with reach.";

// "If you do" is the sacrifice actually made. A Desert sacrificed to the
// second ability is put into your graveyard, so it makes a Plant Warrior too.
const sacrificeALand = {
  kind: "each-player-may",
  who: "you",
  options: [{ sacrifice: { type: "land" }, text: "Sacrifice a land" }],
  ifDid: { kind: "draw", amount: 1 },
} as const;

export default defineCard({
  name: "Yuma, Proud Protector",
  manaCost: "{5}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Ranger"],
  power: 6,
  toughness: 6,
  text: `${COST_TEXT}\n${SAC_TEXT}\n${DESERT_TEXT}`,
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { cardsInGraveyard: { type: "land" } },
  },
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: sacrificeALand, resolve: null, text: SAC_TEXT },
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: sacrificeALand, resolve: null, text: SAC_TEXT },
    {
      trigger: { on: "put-into-graveyard", who: "you", filter: { subtype: "Desert", token: false } },
      targets: [],
      effect: { kind: "create-token", token: "Plant Warrior Token", count: 1 },
      resolve: null,
      text: DESERT_TEXT,
    },
  ],
});
