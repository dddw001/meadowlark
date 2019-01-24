exports.getFortune = () => {
  const fortunes = [
    "Conquer your fears or they will conquer you.",
    "Rivers need springs.",
    "Do not fear what you don't know.",
    "You will have a pleasant surprise.",
    "Whenever possible, keep it simple.",
  ]
  const index = Math.floor(Math.random() * fortunes.length)
  return fortunes[index]
}