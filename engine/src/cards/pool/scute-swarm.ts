import { defineCard } from "../define.js";

// needed-cards P5b — `create-token-copy` with `of: "source"`, plus the new
// `conditional` effect for the "if you control six or more lands … Otherwise …"
// clause (rule 608.2, reusing the EG-3 `StaticCondition` union). Each copy is a
// 1/1 Insect that itself has this landfall ability, so it snowballs — the real
// card's behaviour.
export default defineCard({
  name: "Scute Swarm",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  text:
    "Landfall — Whenever a land you control enters, if you control six or more lands, create a token that's a copy of Scute Swarm. Otherwise, create a 1/1 green Insect creature token.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "land" },
      },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "land" }, atLeast: 6 },
        then: { kind: "create-token-copy", of: "source", count: 1 },
        else: { kind: "create-token", token: "Insect Token", count: 1 },
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, if you control six or more lands, create a token that's a copy of Scute Swarm. Otherwise, create a 1/1 green Insect creature token.",
    },
  ],
});
