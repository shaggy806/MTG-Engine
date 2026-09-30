import { defineCard } from "../define.js";

const DIES_TEXT = "Whenever another nontoken creature dies, you may create a 1/1 black Rat creature token.";
const RAT_TEXT = "Rats you control have deathtouch.";

export default defineCard({
  name: "Ogre Slumlord",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Ogre", "Rogue"],
  power: 3,
  toughness: 3,
  text: `${DIES_TEXT}\n${RAT_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", token: false }, otherOnly: true },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 Rat token?",
        effect: { kind: "create-token", token: "Rat Token", count: 1 },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Rat", controlledBy: "you" } },
      grantKeywords: ["deathtouch"],
      text: RAT_TEXT,
    },
  ],
});
