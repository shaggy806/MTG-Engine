import { defineCard } from "../define.js";

const PUMP_TEXT =
  "{1}{G}{U}, {T}: Target creature you control gains flying and gets +X/+X until end of turn, where X is its power.";

export default defineCard({
  name: "Winged Temple of Orazca",
  art: "https://cards.scryfall.io/art_crop/back/8/e/8e7554bc-8583-4059-8895-c3845bc27ae3.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `(Transforms from Hadana's Climb.)\n{T}: Add one mana of any color.\n${PUMP_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{1}{G}{U}", tap: true },
      targets: ["creature-you-control"],
      // X is its power as this resolves; `modify-pt` reads both amounts
      // before applying either (Arahbo's +X/+X shape).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
          {
            kind: "modify-pt",
            target: 0,
            power: { powerOf: 0 },
            toughness: { powerOf: 0 },
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
  faces: ["Hadana's Climb", "Winged Temple of Orazca"],
  transform: true,
});
