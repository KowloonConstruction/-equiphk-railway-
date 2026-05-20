import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Sample equipment data across all 13 categories
const SAMPLE_EQUIPMENT = [
  // Power Tools (Category 1)
  { categoryId: 1, name: "Makita 18V Cordless Drill", brand: "Makita", model: "DCD777C2", dailyRate: 25, weeklyRate: 120, monthlyRate: 400, quantity: 8, specs: "18V, 1.3Ah batteries, 2-speed transmission" },
  { categoryId: 1, name: "DeWalt Circular Saw", brand: "DeWalt", model: "DCS391D1", dailyRate: 35, weeklyRate: 160, monthlyRate: 500, quantity: 5, specs: "20V, 5-1/8 inch blade, compact design" },
  { categoryId: 1, name: "Bosch Reciprocating Saw", brand: "Bosch", model: "RS20", dailyRate: 40, weeklyRate: 180, monthlyRate: 550, quantity: 4, specs: "20V, variable speed, 0-3000 SPM" },
  { categoryId: 1, name: "Makita Angle Grinder", brand: "Makita", model: "GA5030", dailyRate: 30, weeklyRate: 140, monthlyRate: 450, quantity: 6, specs: "5 inch, 11,000 RPM, paddle switch" },
  { categoryId: 1, name: "Festool Orbital Sander", brand: "Festool", model: "RO90", dailyRate: 45, weeklyRate: 200, monthlyRate: 600, quantity: 3, specs: "3.5 inch, dust extraction, systainer storage" },

  // Scaffolding & Access (Category 2)
  { categoryId: 2, name: "Dr Scaffold Platform 1.2m", brand: "Dr Scaffold", model: "PSF-1200", dailyRate: 50, weeklyRate: 250, monthlyRate: 750, quantity: 12, specs: "1.2m x 0.6m, aluminum, 150kg capacity" },
  { categoryId: 2, name: "Aluminum Extension Ladder 6m", brand: "Gorilla", model: "GLF-6M", dailyRate: 35, weeklyRate: 160, monthlyRate: 500, quantity: 8, specs: "6m, 150kg capacity, non-slip rungs" },
  { categoryId: 2, name: "Mobile Scaffolding Tower", brand: "Werner", model: "MT-6", dailyRate: 80, weeklyRate: 350, monthlyRate: 1000, quantity: 4, specs: "6m height, lockable wheels, guardrails" },

  // Safety Equipment (Category 3)
  { categoryId: 3, name: "Fall Arrest Harness", brand: "3M", model: "DBI-SALA", dailyRate: 15, weeklyRate: 70, monthlyRate: 200, quantity: 20, specs: "Full-body, adjustable, EN 361 certified" },
  { categoryId: 3, name: "Safety Helmet Orange", brand: "MSA", model: "V-Gard", dailyRate: 5, weeklyRate: 20, monthlyRate: 50, quantity: 50, specs: "ABS shell, 4-point suspension, EN 397" },

  // Measuring & Leveling (Category 4)
  { categoryId: 4, name: "Laser Level 50m", brand: "Bosch", model: "GLL 2-50", dailyRate: 40, weeklyRate: 180, monthlyRate: 550, quantity: 5, specs: "50m range, self-leveling, IP54 rated" },
  { categoryId: 4, name: "Digital Angle Gauge", brand: "Starrett", model: "PAG-M", dailyRate: 20, weeklyRate: 90, monthlyRate: 250, quantity: 6, specs: "0-360°, ±0.3° accuracy, magnetic base" },

  // Welding & Cutting (Category 5)
  { categoryId: 5, name: "MIG Welder 200A", brand: "Lincoln", model: "Ranger 305D", dailyRate: 100, weeklyRate: 450, monthlyRate: 1200, quantity: 2, specs: "200A, portable, 110/220V input" },
  { categoryId: 5, name: "Oxy-Acetylene Torch Kit", brand: "Victor", model: "CA2460", dailyRate: 60, weeklyRate: 270, monthlyRate: 800, quantity: 3, specs: "Complete kit, regulators, hoses, tips" },

  // Pneumatic Tools (Category 6)
  { categoryId: 6, name: "Pneumatic Breaker 25kg", brand: "Atlas Copco", model: "LF25", dailyRate: 55, weeklyRate: 250, monthlyRate: 750, quantity: 4, specs: "25kg, 1400 BPM, 6.3 bar" },
  { categoryId: 6, name: "Air Impact Wrench 1/2\"", brand: "Snap-on", model: "MG725", dailyRate: 35, weeklyRate: 160, monthlyRate: 500, quantity: 5, specs: "1/2 inch, 7000 RPM, 600 ft-lbs torque" },

  // Hydraulic Equipment (Category 7)
  { categoryId: 7, name: "Hydraulic Jack 50 Ton", brand: "Enerpac", model: "RCH-50", dailyRate: 45, weeklyRate: 200, monthlyRate: 600, quantity: 3, specs: "50 ton capacity, 4 inch stroke" },
  { categoryId: 7, name: "Hydraulic Pump 2HP", brand: "Parker", model: "PV-2HP", dailyRate: 70, weeklyRate: 320, monthlyRate: 900, quantity: 2, specs: "2HP motor, variable displacement" },

  // Pumps & Fluid Handling (Category 8)
  { categoryId: 8, name: "Submersible Pump 2HP", brand: "Grundfos", model: "SQ3-65", dailyRate: 50, weeklyRate: 230, monthlyRate: 700, quantity: 4, specs: "2HP, 65mm, 220V, 50Hz" },
  { categoryId: 8, name: "Spray Gun HVLP 1.4mm", brand: "DeVilbiss", model: "HVLP-1400", dailyRate: 25, weeklyRate: 115, monthlyRate: 350, quantity: 6, specs: "1.4mm tip, 600ml cup, 25 PSI" },

  // Chainsaws & Outdoor (Category 9)
  { categoryId: 9, name: "Husqvarna Chainsaw 455", brand: "Husqvarna", model: "455", dailyRate: 60, weeklyRate: 270, monthlyRate: 800, quantity: 3, specs: "55.5cc, 3.6kW, 18 inch bar" },

  // Batteries & Power (Category 10)
  { categoryId: 10, name: "Makita 18V Battery 3.0Ah", brand: "Makita", model: "BL1830B", dailyRate: 10, weeklyRate: 45, monthlyRate: 130, quantity: 30, specs: "3.0Ah, LED indicator, 18V LXT" },
  { categoryId: 10, name: "Makita Dual Charger", brand: "Makita", model: "DC18RD", dailyRate: 15, weeklyRate: 70, monthlyRate: 200, quantity: 8, specs: "Charges 2 batteries simultaneously, 30 min" },

  // Hand Tools & Accessories (Category 11)
  { categoryId: 11, name: "Chain Block 2 Ton", brand: "Kito", model: "CB020", dailyRate: 20, weeklyRate: 90, monthlyRate: 250, quantity: 5, specs: "2 ton capacity, 3m lift height" },
  { categoryId: 11, name: "Pipe Stand Heavy Duty", brand: "Sumner", model: "PS-1000", dailyRate: 25, weeklyRate: 115, monthlyRate: 350, quantity: 4, specs: "1000 lb capacity, adjustable height" },

  // Compressors & Air (Category 12)
  { categoryId: 12, name: "Air Compressor 100L 3HP", brand: "Atlas Copco", model: "GA11FF", dailyRate: 80, weeklyRate: 360, monthlyRate: 1000, quantity: 3, specs: "100L tank, 3HP, 8 bar, 380V" },
  { categoryId: 12, name: "Portable Air Fan 20\"", brand: "Lasko", model: "U20310", dailyRate: 15, weeklyRate: 70, monthlyRate: 200, quantity: 8, specs: "20 inch, 3-speed, 120V" },

  // Specialized Equipment (Category 13)
  { categoryId: 13, name: "Concrete Mixer 140L", brand: "Imer", model: "Syntesi 140", dailyRate: 50, weeklyRate: 230, monthlyRate: 700, quantity: 3, specs: "140L drum, 1.1kW, 220V" },
  { categoryId: 13, name: "Electric Winch 1000kg", brand: "Elephant", model: "EW1000", dailyRate: 60, weeklyRate: 270, monthlyRate: 800, quantity: 2, specs: "1000kg capacity, 220V, 20m cable" },
];

async function seedEquipment() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log("Seeding sample equipment...");

    for (const item of SAMPLE_EQUIPMENT) {
      const query = `
        INSERT INTO equipment_items (
          categoryId, name, brand, model, dailyRate, weeklyRate, monthlyRate,
          description, specs, condition, availability, quantity, availableQty,
          imageUrl, isActive, isFeatured, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        item.categoryId,
        item.name,
        item.brand,
        item.model,
        item.dailyRate.toString(),
        item.weeklyRate.toString(),
        item.monthlyRate.toString(),
        `Professional ${item.name} - Perfect for contractors and DIY enthusiasts. High-quality equipment with regular maintenance.`,
        item.specs,
        "good",
        "available",
        item.quantity,
        item.quantity,
        `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}`,
        true,
        Math.random() > 0.7, // 30% featured
      ];

      await connection.execute(query, values);
      console.log(`✓ Added: ${item.name}`);
    }

    console.log(`\n✅ Successfully seeded ${SAMPLE_EQUIPMENT.length} equipment items!`);
  } catch (error) {
    console.error("Error seeding equipment:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedEquipment();
