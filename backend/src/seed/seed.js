require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Property = require("../models/Property");
const FollowUp = require("../models/FollowUp");

const PHOTO = (seed) => `https://picsum.photos/seed/${seed}/640/420`;

const run = async () => {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Property.deleteMany({}),
    FollowUp.deleteMany({}),
  ]);

  console.log("Creating users...");
  const admin = await User.create({
    name: "Aditya Rao",
    email: "admin@estatevista.com",
    phone: "9000000001",
    password: "Password123",
    role: "admin",
  });

  const manager = await User.create({
    name: "Priya Sharma",
    email: "manager@estatevista.com",
    phone: "9000000002",
    password: "Password123",
    role: "manager",
    reportsTo: admin._id,
  });

  const agent1 = await User.create({
    name: "Rohan Mehta",
    email: "rohan@estatevista.com",
    phone: "9000000003",
    password: "Password123",
    role: "agent",
    reportsTo: manager._id,
  });

  const agent2 = await User.create({
    name: "Sneha Kapoor",
    email: "sneha@estatevista.com",
    phone: "9000000004",
    password: "Password123",
    role: "agent",
    reportsTo: manager._id,
  });

  const telecaller = await User.create({
    name: "Karan Verma",
    email: "karan@estatevista.com",
    phone: "9000000005",
    password: "Password123",
    role: "telecaller",
    reportsTo: manager._id,
  });

  console.log("Creating properties...");
  const localities = ["Whitefield", "Indiranagar", "HSR Layout", "Koramangala", "Electronic City", "Hebbal"];
  const propertyDefs = [
    { title: "Skyline Residency 3BHK", type: "residential", subType: "Apartment", bhk: 3, price: 8500000, locality: "Whitefield" },
    { title: "Orchid Greens Villa", type: "residential", subType: "Villa", bhk: 4, price: 21000000, locality: "Hebbal" },
    { title: "Metro Heights 2BHK", type: "residential", subType: "Apartment", bhk: 2, price: 6200000, locality: "Indiranagar" },
    { title: "Business Bay Office Suite", type: "commercial", subType: "Office", bhk: null, price: 15000000, locality: "Koramangala" },
    { title: "Palm Court 1BHK", type: "residential", subType: "Apartment", bhk: 1, price: 4200000, locality: "HSR Layout" },
    { title: "Emerald Plot 2400sqft", type: "plot", subType: "Land", bhk: null, price: 9800000, locality: "Electronic City" },
    { title: "Riverdale 4BHK Penthouse", type: "residential", subType: "Apartment", bhk: 4, price: 32000000, locality: "Indiranagar" },
    { title: "Silver Oak Retail Shop", type: "commercial", subType: "Shop", bhk: null, price: 7600000, locality: "HSR Layout" },
    { title: "Green Valley 3BHK", type: "residential", subType: "Apartment", bhk: 3, price: 9200000, locality: "Whitefield" },
    { title: "Lakeview Villa Plot", type: "plot", subType: "Land", bhk: null, price: 13500000, locality: "Hebbal" },
    { title: "Cedar Heights 2BHK", type: "residential", subType: "Apartment", bhk: 2, price: 5800000, locality: "Koramangala" },
    { title: "Tech Park Commercial Floor", type: "commercial", subType: "Office", bhk: null, price: 24000000, locality: "Electronic City" },
  ];

  const statuses = ["available", "available", "available", "hold", "booked", "sold", "rented"];
  const properties = [];
  for (let i = 0; i < propertyDefs.length; i++) {
    const def = propertyDefs[i];
    const agent = i % 2 === 0 ? agent1 : agent2;
    const carpet = def.bhk ? def.bhk * 350 + 100 : 1200;
    const p = await Property.create({
      title: def.title,
      type: def.type,
      subType: def.subType,
      config: {
        bhk: def.bhk,
        carpetAreaSqft: carpet,
        builtUpAreaSqft: Math.round(carpet * 1.15),
        floor: def.type === "plot" ? "" : `${(i % 12) + 1} of 15`,
        facing: ["North", "East", "South", "West"][i % 4],
        furnishing: ["unfurnished", "semi_furnished", "furnished"][i % 3],
      },
      price: {
        amount: def.price,
        pricePerSqft: Math.round(def.price / carpet),
        bookingAmount: Math.round(def.price * 0.1),
        maintenance: def.type === "plot" ? 0 : 2500 + i * 100,
        negotiable: i % 3 === 0,
      },
      location: {
        address: `${def.locality} Main Road`,
        locality: def.locality,
        city: "Bengaluru",
        pincode: `5600${10 + (i % 80)}`,
        lat: 12.9 + i * 0.01,
        lng: 77.6 + i * 0.01,
      },
      status: statuses[i % statuses.length],
      media: {
        photos: [PHOTO(`ev-property-${i}-1`), PHOTO(`ev-property-${i}-2`)],
        floorPlanUrl: "",
        brochureUrl: "",
        videoUrl: "",
      },
      ownership: { ownerName: `Owner ${i + 1}`, reraId: `RERA/BLR/${1000 + i}` },
      listingAgentId: agent._id,
    });
    properties.push(p);
  }

  console.log("Creating leads...");
  const sources = ["magicbricks", "99acres", "housing_com", "facebook_ads", "website", "referral", "walk_in", "manual"];
  const stages = ["new", "contacted", "qualified", "site_visit_scheduled", "negotiating", "closed_won", "closed_lost"];
  const firstNames = ["Arjun", "Divya", "Vikram", "Ananya", "Rahul", "Isha", "Nikhil", "Meera", "Suresh", "Pooja", "Amit", "Kavya", "Rajesh", "Neha", "Sanjay", "Ritu"];
  const owners = [agent1, agent2, telecaller];

  const leads = [];
  for (let i = 0; i < 40; i++) {
    const stage = stages[i % stages.length];
    const owner = owners[i % owners.length];
    const dealValue = stage === "closed_won" ? propertyDefs[i % propertyDefs.length].price : 0;
    const monthsAgo = i % 6;
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - monthsAgo);

    const lead = await Lead.create({
      name: `${firstNames[i % firstNames.length]} ${["Kumar", "Reddy", "Nair", "Iyer", "Singh", "Gowda"][i % 6]}`,
      phone: `98${(10000000 + i * 37).toString().slice(0, 8)}`,
      email: `lead${i}@example.com`,
      source: sources[i % sources.length],
      requirement: {
        propertyType: ["residential", "commercial", "plot"][i % 3],
        budgetMin: 4000000 + i * 100000,
        budgetMax: 9000000 + i * 150000,
        bhk: [1, 2, 3, 4][i % 4],
        preferredLocalities: [localities[i % localities.length]],
      },
      stage,
      lostReason: stage === "closed_lost" ? ["Chose competitor", "Budget mismatch", "Postponed purchase"][i % 3] : "",
      ownerId: owner._id,
      nextFollowUpAt: stage === "closed_won" || stage === "closed_lost" ? null : new Date(Date.now() + (i % 5) * 86400000),
      dealValue,
      notes: "Seed data generated for demo purposes.",
    });
    lead.createdAt = createdAt;
    await lead.save();
    leads.push(lead);

    await FollowUp.create({
      leadId: lead._id,
      type: ["call", "whatsapp", "email", "note"][i % 4],
      outcome: "Initial contact logged",
      completedAt: createdAt,
      createdBy: owner._id,
    });
  }

  console.log("Seed complete.");
  console.log("----------------------------------------");
  console.log("Demo login credentials (password: Password123):");
  console.log("  Admin:      admin@estatevista.com");
  console.log("  Manager:    manager@estatevista.com");
  console.log("  Agent:      rohan@estatevista.com");
  console.log("  Agent:      sneha@estatevista.com");
  console.log("  Telecaller: karan@estatevista.com");
  console.log("----------------------------------------");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
