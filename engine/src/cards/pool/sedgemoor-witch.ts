import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const MAGECRAFT_TEXT =
  "Magecraft — Whenever you cast or copy an instant or sorcery spell, create a 1/1 black and green Pest creature token with \"When this token dies, you gain 1 life.\"";

// Rulings: a copy of an instant or sorcery spell triggers magecraft (once per
// copy); copying a card in another zone doesn't, unless the copy is cast.
export default defineCard({
  name: "Sedgemoor Witch",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: `Menace\nWard—Pay 3 life. (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays 3 life.)\n${MAGECRAFT_TEXT}`,
  triggered: [
    ward({ payLife: 3 }),
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "create-token", token: "Pest Token", count: 1 },
      resolve: null,
      text: MAGECRAFT_TEXT,
    },
  ],
});
