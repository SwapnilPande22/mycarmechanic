import { query } from "./_generated/server";
import { carModels } from "./data/carVariants";
import { indianCities } from "./data/cities";

export const options = query({
  args: {},
  handler: async () => ({
    models:carModels.map((model) => ({ ...model, name:`${model.make} ${model.model}` })),
    variants:carModels.flatMap((model) => model.variants.map((variant) => ({
      name:`${model.make} ${model.model} ${variant}`, make:model.make, model:model.model,
      variant, aliases:model.aliases.map((alias) => `${alias} ${variant}`), vehicleClass:model.vehicleClass,
    }))),
    cities:indianCities,
  }),
});
