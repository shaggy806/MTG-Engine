import { defineCard } from "../define.js";

/** The compensating search is made by the *destroyed* permanent's controller,
 * which is what `search-library`'s `who: { controllerOfTarget }` addresses —
 * it reads last-known information (rule 608.2h), so the target still names its
 * controller after it has gone. `min: 0` is the "**may** search". */
export default defineCard({
  name: "Assassin's Trophy",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text:
    "Destroy target permanent an opponent controls. Its controller may search their library " +
    "for a basic land card, put it onto the battlefield, then shuffle.",
  targets: [{ kind: "permanent", whose: "opponent", filter: {} }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "search-library",
        who: { controllerOfTarget: 0 },
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
    ],
  },
});
