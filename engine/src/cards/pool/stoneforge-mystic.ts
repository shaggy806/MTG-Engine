import { defineCard } from "../define.js";

const ETB_TEXT =
  "When this creature enters, you may search your library for an Equipment card, reveal it, put it into your hand, then shuffle.";
const PUT_TEXT = "{1}{W}, {T}: You may put an Equipment card from your hand onto the battlefield.";

// Any Equipment card in your hand, not only the one it found; it enters
// unattached (the ruling).
export default defineCard({
  name: "Stoneforge Mystic",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Artificer"],
  power: 1,
  toughness: 2,
  text: `${ETB_TEXT}\n${PUT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Equipment" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{W}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { subtype: "Equipment" },
      },
      resolve: null,
      text: PUT_TEXT,
    },
  ],
});
