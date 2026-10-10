export type CarModel = {
  make: string;
  model: string;
  aliases: string[];
  vehicleClass: "hatchback" | "sedan" | "small_suv" | "suv";
  variants: string[];
};

// Common Indian-market trims, including discontinued models still on the road.
// Suggestions are a convenience; customers may enter a variant not listed here.
// Polo: https://www.volkswagen.co.in/idhub/content/dam/onehub_pkw/importers/in/pdf/Polo-Brochure-June-2021.pdf
// Swift: https://www.marutisuzuki.com/arena/swift
export const carModels: CarModel[] = [
  { make:"Volkswagen", model:"Polo", aliases:["Polo"], vehicleClass:"hatchback", variants:["GT TSI", "Highline 1.0 TSI", "Highline Plus 1.0 TSI", "Comfortline 1.0 TSI", "Comfortline 1.0 MPI", "Trendline 1.0 MPI", "Highline 1.5 TDI", "GT TDI"] },
  { make:"Maruti", model:"Swift", aliases:["Swift", "Maruti Suzuki Swift"], vehicleClass:"hatchback", variants:["LXi", "VXi", "VXi AMT", "ZXi", "ZXi+", "VXi CNG"] },
  { make:"Maruti", model:"Alto K10", aliases:["Alto", "Maruti Suzuki Alto K10"], vehicleClass:"hatchback", variants:["Std", "LXi", "VXi", "VXi+", "VXi AGS", "VXi CNG"] },
  { make:"Maruti", model:"Celerio", aliases:["Celerio", "Maruti Suzuki Celerio"], vehicleClass:"hatchback", variants:["LXi", "VXi", "ZXi", "ZXi+", "VXi AGS"] },
  { make:"Maruti", model:"Wagon R", aliases:["Wagon R", "WagonR", "Maruti Suzuki Wagon R"], vehicleClass:"hatchback", variants:["LXi 1.0", "VXi 1.0", "ZXi 1.2", "ZXi+ 1.2", "VXi CNG"] },
  { make:"Maruti", model:"Baleno", aliases:["Baleno", "Maruti Suzuki Baleno"], vehicleClass:"hatchback", variants:["Sigma", "Delta", "Zeta", "Alpha", "Delta AGS", "Zeta CNG"] },
  { make:"Maruti", model:"Ignis", aliases:["Ignis", "Maruti Suzuki Ignis"], vehicleClass:"hatchback", variants:["Sigma", "Delta", "Zeta", "Alpha"] },
  { make:"Maruti", model:"Dzire", aliases:["Dzire", "Swift Dzire", "Maruti Suzuki Dzire"], vehicleClass:"sedan", variants:["LXi", "VXi", "ZXi", "ZXi+", "VXi AMT", "VXi CNG"] },
  { make:"Maruti", model:"Ciaz", aliases:["Ciaz", "Maruti Suzuki Ciaz"], vehicleClass:"sedan", variants:["Sigma", "Delta", "Zeta", "Alpha"] },
  { make:"Maruti", model:"Fronx", aliases:["Fronx", "Maruti Suzuki Fronx"], vehicleClass:"small_suv", variants:["Sigma", "Delta", "Delta+", "Zeta 1.0 Turbo", "Alpha 1.0 Turbo"] },
  { make:"Maruti", model:"Brezza", aliases:["Brezza", "Vitara Brezza", "Maruti Suzuki Brezza"], vehicleClass:"small_suv", variants:["LXi", "VXi", "ZXi", "ZXi+", "VXi AT"] },
  { make:"Maruti", model:"Grand Vitara", aliases:["Grand Vitara", "Maruti Suzuki Grand Vitara"], vehicleClass:"suv", variants:["Sigma", "Delta", "Zeta", "Alpha", "Zeta+ Hybrid", "Alpha+ Hybrid"] },
  { make:"Maruti", model:"Ertiga", aliases:["Ertiga", "Maruti Suzuki Ertiga"], vehicleClass:"suv", variants:["LXi", "VXi", "ZXi", "ZXi+", "VXi CNG"] },
  { make:"Hyundai", model:"Grand i10 NIOS", aliases:["i10", "Grand i10", "Nios"], vehicleClass:"hatchback", variants:["Era", "Magna", "Sportz", "Asta", "Sportz AMT"] },
  { make:"Hyundai", model:"i20", aliases:["i20"], vehicleClass:"hatchback", variants:["Era", "Magna", "Sportz", "Asta", "Asta (O)"] },
  { make:"Hyundai", model:"Aura", aliases:["Aura"], vehicleClass:"sedan", variants:["E", "S", "SX", "SX (O)", "S CNG"] },
  { make:"Hyundai", model:"Verna", aliases:["Verna"], vehicleClass:"sedan", variants:["EX", "S", "SX", "SX (O)", "SX Turbo"] },
  { make:"Hyundai", model:"Exter", aliases:["Exter"], vehicleClass:"small_suv", variants:["EX", "S", "SX", "SX (O)", "SX (O) Connect"] },
  { make:"Hyundai", model:"Creta", aliases:["Creta"], vehicleClass:"suv", variants:["E", "EX", "S", "SX", "SX (O)", "SX (O) Diesel AT"] },
  { make:"Tata", model:"Tiago", aliases:["Tiago"], vehicleClass:"hatchback", variants:["XE", "XM", "XT", "XZ", "XZ+", "XT iCNG"] },
  { make:"Tata", model:"Altroz", aliases:["Altroz"], vehicleClass:"hatchback", variants:["XE", "XM", "XT", "XZ", "XZ+", "XZ DCA"] },
  { make:"Tata", model:"Tigor", aliases:["Tigor"], vehicleClass:"sedan", variants:["XE", "XM", "XZ", "XZ+", "XZ iCNG"] },
  { make:"Tata", model:"Punch", aliases:["Punch"], vehicleClass:"small_suv", variants:["Pure", "Adventure", "Accomplished", "Creative", "Adventure AMT"] },
  { make:"Tata", model:"Nexon", aliases:["Nexon"], vehicleClass:"small_suv", variants:["Smart", "Smart+", "Pure", "Creative", "Fearless", "Creative Diesel"] },
  { make:"Tata", model:"Harrier", aliases:["Harrier"], vehicleClass:"suv", variants:["Smart", "Pure", "Adventure", "Fearless", "Fearless+ AT"] },
  { make:"Tata", model:"Safari", aliases:["Safari"], vehicleClass:"suv", variants:["Smart", "Pure", "Adventure", "Accomplished", "Accomplished+ AT"] },
  { make:"Toyota", model:"Glanza", aliases:["Glanza"], vehicleClass:"hatchback", variants:["E", "S", "G", "V", "G AMT"] },
  { make:"Toyota", model:"Urban Cruiser Hyryder", aliases:["Hyryder"], vehicleClass:"suv", variants:["E", "S", "G", "V", "S Hybrid", "V Hybrid"] },
  { make:"Honda", model:"Amaze", aliases:["Amaze"], vehicleClass:"sedan", variants:["E", "S", "VX", "V", "ZX", "VX CVT"] },
  { make:"Honda", model:"City", aliases:["City"], vehicleClass:"sedan", variants:["SV", "V", "VX", "ZX", "ZX CVT"] },
  { make:"Skoda", model:"Slavia", aliases:["Slavia"], vehicleClass:"sedan", variants:["Active 1.0 TSI", "Ambition 1.0 TSI", "Style 1.0 TSI", "Style 1.5 TSI"] },
  { make:"Volkswagen", model:"Virtus", aliases:["Virtus"], vehicleClass:"sedan", variants:["Comfortline 1.0 TSI", "Highline 1.0 TSI", "Topline 1.0 TSI", "GT Plus 1.5 TSI"] },
  { make:"Nissan", model:"Magnite", aliases:["Magnite"], vehicleClass:"small_suv", variants:["XE", "XL", "XV", "XV Premium", "XV Turbo CVT"] },
  { make:"Renault", model:"Kiger", aliases:["Kiger"], vehicleClass:"small_suv", variants:["RXE", "RXL", "RXT", "RXZ", "RXZ Turbo CVT"] },
  { make:"Kia", model:"Sonet", aliases:["Sonet"], vehicleClass:"small_suv", variants:["HTE", "HTK", "HTK+", "HTX", "GTX+", "X-Line"] },
  { make:"Kia", model:"Seltos", aliases:["Seltos"], vehicleClass:"suv", variants:["HTE", "HTK", "HTK+", "HTX", "HTX+", "GTX+", "X-Line"] },
  { make:"Mahindra", model:"XUV 3XO", aliases:["XUV 3XO", "3XO"], vehicleClass:"small_suv", variants:["MX1", "MX2", "MX3", "AX5", "AX7", "AX7 L"] },
  { make:"Mahindra", model:"Scorpio-N", aliases:["Scorpio N", "Scorpio-N"], vehicleClass:"suv", variants:["Z2", "Z4", "Z6", "Z8", "Z8 L"] },
  { make:"Mahindra", model:"XUV700", aliases:["XUV700"], vehicleClass:"suv", variants:["MX", "AX3", "AX5", "AX7", "AX7 L"] },
];
