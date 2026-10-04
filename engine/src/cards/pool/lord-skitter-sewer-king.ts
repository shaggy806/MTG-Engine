import { defineCard } from "../define.js";

const EXILE_TEXT = "Whenever another Rat you control enters, exile up to one target card from an opponent's graveyard.";
const RAT_TEXT =
  "At the beginning of combat on your turn, create a 1/1 black Rat creature token with \"This token can't block.\"";

export default defineCard({
  name: "Lord Skitter, Sewer King",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rat", "Noble"],
  power: 3,
  toughness: 3,
  text: `${EXILE_TEXT}\n${RAT_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Rat" },
        otherOnly: true,
      },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "opponent" } }],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: EXILE_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Rat Token (Can't Block)", count: 1 },
      resolve: null,
      text: RAT_TEXT,
    },
  ],
});
