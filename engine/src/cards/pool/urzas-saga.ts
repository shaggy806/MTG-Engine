import type { ActivatedAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// A land, so it's only ever played, never cast (its ruling), and it enters
// with its first lore counter however it arrives (rule 714.3a). The chapters'
// abilities stay for as long as it's on the battlefield. Chapter III finds a
// card whose mana cost is {0} or {1} — not {U}, not {X}, not none (its
// ruling).
const MANA_TEXT = "{T}: Add {C}.";
const CONSTRUCT_TEXT =
  "{2}, {T}: Create a 0/0 colorless Construct artifact creature token with \"This token gets +1/+1 for each " +
  'artifact you control."';
const I_TEXT = `I — This Saga gains "${MANA_TEXT}"`;
const II_TEXT = `II — This Saga gains "{2}, {T}: Create a 0/0 colorless Construct artifact creature token with 'This token gets +1/+1 for each artifact you control.'"`;
const III_TEXT =
  "III — Search your library for an artifact card with mana cost {0} or {1}, put it onto the battlefield, " +
  "then shuffle.";

const MANA: ActivatedAbility = {
  cost: { mana: null, tap: true },
  targets: [],
  effect: { kind: "add-mana", mana: "C", amount: 1 },
  resolve: null,
  text: MANA_TEXT,
};
const CONSTRUCT: ActivatedAbility = {
  cost: { mana: "{2}", tap: true },
  targets: [],
  effect: { kind: "create-token", token: "Construct Token", count: 1 },
  resolve: null,
  text: CONSTRUCT_TEXT,
};

export default defineCard({
  name: "Urza's Saga",
  types: ["enchantment", "land"],
  subtypes: ["Urza's", "Saga"],
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n" +
    `${I_TEXT}\n${II_TEXT}\n${III_TEXT}`,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "grant-activated", target: "source", ability: MANA, duration: "permanent" },
      resolve: null,
      text: I_TEXT,
    },
    {
      at: [2],
      targets: [],
      effect: { kind: "grant-activated", target: "source", ability: CONSTRUCT, duration: "permanent" },
      resolve: null,
      text: II_TEXT,
    },
    {
      at: [3],
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "artifact", manaCost: ["{0}", "{1}"] },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: III_TEXT,
    },
  ],
});
