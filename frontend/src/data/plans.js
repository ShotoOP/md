export const durationMultipliers = {
  "18 Months": 1,
  "21 Months": 1.2,
  "24 Months": 1.5,
};

export function calculatePrice(plan, duration) {
  return plan.basePrice * (durationMultipliers[duration] || 1);
}

export const allPlans = {
  premium: {
    "Algo Indicator": {
      durations: ["18 Months", "21 Months", "24 Months"],
      plans: [
        {
          name: "Algo Indicator Pro",
          basePrice: 30,
          users: "3 users",
          storage: "100 GB",
          support: "Priority email support",
          encryption: "AES-256",
          backup: "Hourly",
          apiAccess: "Yes",
          languageSupport: "Multiple",
          dedicatedManager: "Yes",
          btnText: "Choose Plan",
        },
      ],
    },
    "Smart Investment": {
      durations: ["18 Months", "21 Months", "24 Months"],
      plans: [
        {
          name: "Smart Investment Premium",
          basePrice: 50,
          users: "5 users",
          storage: "500 GB",
          support: "24/7 support",
          encryption: "AES-256",
          backup: "Real-time",
          apiAccess: "Yes",
          languageSupport: "Multiple",
          dedicatedManager: "Yes",
          btnText: "Choose Plan",
        },
      ],
    },
  },
};
