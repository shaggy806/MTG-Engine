import { defineCard } from "../define.js";

// Regisaur Alpha's Dinosaur token: a 3/3 green Dinosaur with trample.

export default defineCard({
  name: "Dinosaur Token",
  art: "59b5a5de-f799-49a0-925f-a0cfd46045b5",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample",
});
