import { defineCard } from "../define.js";

// An X/X green Dinosaur with trample — Ghalta and Mavren's token. Its X is set
// by the effect that makes it (`create-token`'s `basePt`); printed, it's 0/0.
export default defineCard({
  name: "X/X Dinosaur Token (Trample)",
  art: "50b6ea55-c976-40e7-aa09-5ba77688bfe9",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text: "Trample",
});
