import { defineCard } from "../define.js";
import type { TargetSpec } from "../../target.js";

const TEXT =
  "Whenever this creature dies or another artifact you control is put into a graveyard from the battlefield, return to your hand target artifact card in your graveyard with lesser mana value.";

// "Lesser" than the artifact that went to the graveyard, as it last existed
// on the battlefield — a copy's mana value, not the card's (the rulings). The
// printed ability's two halves are two triggers here, so Scrap Trawler
// dying counts whether or not it's still an artifact, and dying alongside
// other artifacts it triggers for each.
const LESSER: TargetSpec = {
  kind: "card-in-graveyard",
  whose: "you",
  filter: { type: "artifact", manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } } },
};

export default defineCard({
  name: "Scrap Trawler",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [LESSER],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "Whenever this creature dies, return to your hand target artifact card in your graveyard with lesser mana value.",
    },
    {
      trigger: { on: "dies", who: "you-control", otherOnly: true, filter: { type: "artifact" } },
      targets: [LESSER],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text:
        "Whenever another artifact you control is put into a graveyard from the battlefield, return to your hand target artifact card in your graveyard with lesser mana value.",
    },
  ],
});
