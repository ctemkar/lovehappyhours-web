// Script to add happy hour deals to all Bangkok venues
// Run this to generate deals for all venues

const happyHourTemplates = [
  {
    title: "Happy Hour",
    description: "Buy 1 Get 1 Free on selected drinks",
    discountType: "bogo",
    discountValue: 50,
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: "17:00",
    endTime: "19:00"
  },
  {
    title: "After Work Special",
    description: "30% off all drinks from 5PM-7PM",
    discountType: "percentage",
    discountValue: 30,
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: "17:00",
    endTime: "19:00"
  },
  {
    title: "Sunset Deals",
    description: "40% off during sunset hours",
    discountType: "percentage",
    discountValue: 40,
    days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    startTime: "17:00",
    endTime: "19:00"
  },
  {
    title: "Ladies Night",
    description: "Free drink for ladies",
    discountType: "fixed",
    discountValue: 100,
    days: ["friday", "saturday"],
    startTime: "20:00",
    endTime: "23:00"
  },
  {
    title: "Craft Beer Hour",
    description: "25% off craft beers",
    discountType: "percentage",
    discountValue: 25,
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: "16:00",
    endTime: "18:00"
  },
  {
    title: "Cocktail Special",
    description: "2 for 1 cocktails",
    discountType: "bogo",
    discountValue: 50,
    days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    startTime: "18:00",
    endTime: "20:00"
  }
];

console.log("Happy hour templates created:");
console.log(JSON.stringify(happyHourTemplates, null, 2));
