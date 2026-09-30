import { defineCard } from "../define.js";

// Path to Exile's shape with destroy: the controller searches whether or not
// the creature was destroyed (indestructible), as the card says nothing else.
export default defineCard({
  name: "Erode",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Destroy target creature or planeswalker. Its controller may search their library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
        who: { controllerOfTarget: 0 },
      },
    ],
  },
});
