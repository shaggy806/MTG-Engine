import { defineCard } from "../define.js";

// EDHREC rank 750. Imprint links the two abilities (rule 607.2a), as Chrome
// Mox's does. "You may copy the exiled card. If you do, you may cast the
// copy" is one "may": a copy not cast ceases to exist (rule 704.5e) without
// anything having seen it, so declining either is the same.
const IMPRINT = "Imprint — When this artifact enters, you may exile an instant card with mana value 2 or less from your hand.";
const COPY = "{2}, {T}: You may copy the exiled card. If you do, you may cast the copy without paying its mana cost.";

export default defineCard({
  name: "Isochron Scepter",
  manaCost: "{2}",
  types: ["artifact"],
  text: `${IMPRINT}\n${COPY}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "exile",
        leftover: "stay",
        filter: { type: "instant", manaValue: { op: "lte", n: 2 } },
      },
      resolve: null,
      text: IMPRINT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "cast-now", from: "exiled-with-source", copies: 1, free: true },
      resolve: null,
      text: COPY,
    },
  ],
});
