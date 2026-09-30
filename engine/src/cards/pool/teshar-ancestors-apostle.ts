import { defineCard } from "../define.js";

const TEXT =
  "Whenever you cast a historic spell, return target creature card with mana value 3 or less from your graveyard to the battlefield.";

export default defineCard({
  name: "Teshar, Ancestor's Apostle",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${TEXT} (Artifacts, legendaries, and Sagas are historic.)`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
