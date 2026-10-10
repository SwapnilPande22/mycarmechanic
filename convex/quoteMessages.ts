export function garageMessage(request: { carModel: string; area: string; city?: string; parts: { partName: string; workNeeded: string }[] }) {
  const location = [request.area, request.city].map(value => value?.trim())
    .filter((value): value is string => Boolean(value) && !/^(undefined|null)$/i.test(value!))
    .filter((value, index, values) => values.findIndex(other => other.toLowerCase() === value.toLowerCase()) === index).join(", ");
  return ["Hi, I need a repair quote for this car.", `Car: ${request.carModel}`, `Location: ${location}`,
    "Damage:", ...request.parts.map((part, index) => `${index + 1}. ${part.partName} – ${part.workNeeded}`),
    "Please reply with your total price and when you can take the car."].join("\n");
}
