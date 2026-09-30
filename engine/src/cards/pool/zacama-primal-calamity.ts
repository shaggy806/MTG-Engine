import { defineCard } from "../define.js";

const ENTER_TEXT = "When Zacama enters, if you cast it, untap all lands you control.";

export default defineCard({
  name: "Zacama, Primal Calamity",
  manaCost: "{6}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dinosaur"],
  power: 9,
  toughness: 9,
  keywords: ["reach", "vigilance", "trample"],
  text:
    `Reach, vigilance, trample\n${ENTER_TEXT}\n` +
    "{2}{R}: Zacama deals 3 damage to target creature.\n" +
    "{2}{G}: Destroy target artifact or enchantment.\n" +
    "{2}{W}: You gain 3 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "source", filter: { cast: true, castBy: "you" } },
      targets: [],
      effect: { kind: "untap-all", filter: { type: "land", controlledBy: "you" } },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "{2}{R}: Zacama deals 3 damage to target creature.",
    },
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{2}{G}: Destroy target artifact or enchantment.",
    },
    {
      cost: { mana: "{2}{W}", tap: false },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "{2}{W}: You gain 3 life.",
    },
  ],
});
