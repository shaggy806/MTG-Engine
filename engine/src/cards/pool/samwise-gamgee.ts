import { defineCard } from "../define.js";

const FOOD_TEXT =
  "Whenever another nontoken creature you control enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")";
const RETURN_TEXT =
  "Sacrifice three Foods: Return target historic card from your graveyard to your hand. (Artifacts, legendaries, and Sagas are historic.)";
const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;

// "A Food" is any Food artifact, not only a Food token (the 2024-11-08
// ruling) — `subtype: "Food"`. The three are chosen as the cost is paid.
export default defineCard({
  name: "Samwise Gamgee",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Peasant"],
  power: 2,
  toughness: 2,
  text: `${FOOD_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "Whenever another nontoken creature you control enters, create a Food token.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Food" }, count: 3 } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: HISTORIC }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "Sacrifice three Foods: Return target historic card from your graveyard to your hand.",
    },
  ],
});
