import { defineCard } from "../define.js";

/** A transforming DFC that turns over via its own activated ability (rule
 * 701.28 — a transform ability uses the stack), gated by an "Activate only
 * if…" condition (rule 602.5). */
export default defineCard({
  name: "Bloodline Keeper",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "{T}: Create a 2/2 black Vampire creature token with flying.\n" +
    "{B}: Transform Bloodline Keeper. Activate only if you control five or more Vampires.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Vampire Token", count: 1 },
      resolve: null,
      text: "{T}: Create a 2/2 black Vampire creature token with flying.",
    },
    {
      cost: { mana: "{B}", tap: false },
      condition: {
        kind: "controls",
        filter: { subtype: "Vampire" },
        atLeast: 5,
      },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: "{B}: Transform Bloodline Keeper. Activate only if you control five or more Vampires.",
    },
  ],
  faces: ["Bloodline Keeper", "Lord of Lineage"],
  transform: true,
});
