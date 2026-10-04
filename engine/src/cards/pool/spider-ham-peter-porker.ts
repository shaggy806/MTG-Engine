import { defineCard } from "../define.js";

// EDHREC rank 5630.
// Makes Food → uses "Food Token".
//
// "Animal May-Ham" is an ability word. `subtypes` is an OR over the eighteen
// creature types (Mice is Mouse, Wolves Wolf), changeling included through
// `hasSubtype`; "other" leaves Spider-Ham itself out.

const ANIMALS = [
  "Spider",
  "Boar",
  "Bat",
  "Bear",
  "Bird",
  "Cat",
  "Dog",
  "Frog",
  "Jackal",
  "Lizard",
  "Mouse",
  "Otter",
  "Rabbit",
  "Raccoon",
  "Rat",
  "Squirrel",
  "Turtle",
  "Wolf",
];
const FOOD_TEXT = "When Spider-Ham enters, create a Food token.";
const ANTHEM_TEXT =
  "Animal May-Ham — Other Spiders, Boars, Bats, Bears, Birds, Cats, Dogs, Frogs, Jackals, Lizards, Mice, Otters, Rabbits, Raccoons, Rats, Squirrels, Turtles, and Wolves you control get +1/+1.";

export default defineCard({
  name: "Spider-Ham, Peter Porker",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spider", "Boar", "Hero"],
  power: 2,
  toughness: 2,
  text: `${FOOD_TEXT} (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")\n${ANTHEM_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: FOOD_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtypes: ANIMALS, controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
});
