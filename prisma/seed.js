import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { locationsData } from "./locations-data.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // Create Admin User
  // console.log("👤 Creating admin user...");

  // const hashedPassword = await bcrypt.hash("admin123", 10);

  // const admin = await prisma.user.upsert({
  //   where: { email: "admin@sidegurus.com" },
  //   update: {},
  //   create: {
  //     fullName: "Admin User",
  //     email: "admin@sidegurus.com",
  //     password: hashedPassword,
  //     role: "ADMIN",
  //     isEmailVerified: true,
  //     phoneNumber: "+1234567890"
  //   }
  // });

  // console.log("✅ Admin user created");
  // console.log("   Email: admin@sidegurus.com");
  // console.log("   Password: admin123\n");

  // Create Countries, Regions, and Cities from locationsData
  console.log("📍 Creating countries, regions, and cities...");

  let totalCountries = 0;
  let totalRegions = 0;
  let totalCities = 0;

  // Seed all countries/regions/cities from locations-data
  const filteredLocations = locationsData;

  for (const [countryName, regions] of Object.entries(filteredLocations)) {
    // Create country
    const country = await prisma.country.upsert({
      where: { name: countryName },
      update: {},
      create: { name: countryName },
    });
    totalCountries++;
    console.log(`  ✓ ${countryName}`);

    // Create regions and cities for this country
    for (const [regionName, cities] of Object.entries(regions)) {
      const region = await prisma.region.upsert({
        where: { name_countryId: { name: regionName, countryId: country.id } },
        update: {},
        create: { name: regionName, countryId: country.id },
      });
      totalRegions++;

      // Create cities for this region
      for (const cityName of cities) {
        await prisma.city.upsert({
          where: { name_regionId: { name: cityName, regionId: region.id } },
          update: {},
          create: { name: cityName, regionId: region.id },
        });
        totalCities++;
      }
    }
  }

  console.log(
    `\n✅ Created ${totalCountries} countries, ${totalRegions} regions, and ${totalCities} cities`,
  );

  // Create Categories and SubCategories
  // console.log('\n📂 Creating categories and subcategories...');

    const categoryImageMap = {
      'Home Improvement & Repair Services': '/uploads/categories/images/Home_Improvement.jpg',
      'Business & Professional Services': '/uploads/categories/images/Business_Professional.avif',
      'Language Services': '/uploads/categories/images/Language_Services.webp',
      'Eco-Friendly & Sustainable Professions': '/uploads/categories/images/Eco-Friendly.webp',
      'Tech & Digital Professions': '/uploads/categories/images/4a546df23882125858705f7963a871fcb0069514.jpg',
      'Outdoor & Adventure Professions': '/uploads/categories/images/2ddd749ebbc903386681dbab652b7ad2d753c350.jpg',
      'Automotive Services': '/uploads/categories/images/Automotive.webp',
      'Fitness & Sports Coaching': '/uploads/categories/images/a69bfb11c363caf0bed055bbd3fe973ea06224cd.jpg',
      'Childcare & Senior Care': '/uploads/categories/images/272a64299b9fa3c666c1dc0386bac84370d4e07e.jpg',
      'Music & Entertainment Services': '/uploads/categories/images/nmg-network-tS8UGM0pvmI-unsplash.jpg',
      'Expanded Business & Professional Services': '/uploads/categories/images/krakenimages-376KN_ISplE-unsplash.jpg',
      'Miscellaneous Unique Professions': '/uploads/categories/images/Miscellaneous.jpg',
      'Beauty & Personal Care Services': '/uploads/categories/images/engin-akyurt-g-m8EDc4X6Q-unsplash.jpg',
      'Elderly & Disability Services': '/uploads/categories/images/care-assure-Zx4ddAfk0Ck-unsplash.jpg',
      'Business & Marketing Professions': '/uploads/categories/images/airfocus-D4D1WzaVpk8-unsplash.jpg',
      'Unique & Niche Professions': '/uploads/categories/images/austin-distel-wD1LRb9OeEo-unsplash.jpg',
      'Educational & Tutoring Services': '/uploads/categories/images/sofatutor-4r5Hogjbgkw-unsplash.jpg',
      'Food & Beverage Professions': '/uploads/categories/images/15.jpg',
      'Event & Entertainment Professions': '/uploads/categories/images/austin-distel-rxpThOwuVgE-unsplash.jpg',
      'Handmade & Custom Creations': '/uploads/categories/images/annie-spratt-TywjkDHf0Ps-unsplash.jpg',
      'Personal & Lifestyle Services': '/uploads/categories/images/jared-rice-NTyBbu66_SI-unsplash.jpg',
      'Creative & Artistic': '/uploads/categories/images/matthieu-comoy-koo_vYrlU_U-unsplash.jpg',
      'Security & Safety Services': '/uploads/categories/images/collin-8FxJi5wuwKc-unsplash.jpg',
      'Legal & Financial Services': '/uploads/categories/images/towfiqu-barbhuiya-nApaSgkzaxg-unsplash.jpg',
      'Health & Wellness': '/uploads/categories/images/Discover_a_transformative_approach_to_health_and.webp',
      'Event Services': '/uploads/categories/images/event-management-service.jpg',
      'Real Estate & Moving Services': '/uploads/categories/images/vitaly-gariev-wS40ELZROLE-unsplash.jpg',
      'Technology & Electronics': '/uploads/categories/images/alexandre-debieve-FO7JIlwjOtU-unsplash.jpg',
      'Writing & Publishing Services': '/uploads/categories/images/unseen-studio-s9CC2SKySJM-unsplash.jpg',
      'Lifestyle & Personal Services': '/uploads/categories/images/1b04ebc7e78546de8555336074a71f4e8238dbe1.jpg',
      'Cleaning & Maintenance Services': '/uploads/categories/images/towfiqu-barbhuiya--9gPKrsbGmc-unsplash.jpg',
      'Pet Services': '/uploads/categories/images/j-balla-photography-F57xLufncj8-unsplash.jpg',
      'Miscellaneous Services': '/uploads/categories/images/f7d88f04f0c8054d304977729b35497898a1a675.jpg'
    };

    const eventCategoryImageMap = {
      'Other': '/uploads/events/event/other.webp',
      'Videographer': '/uploads/events/event/Videographer.jpg',
      'Personal Tour Guides': '/uploads/events/event/tour.webp',
      'Outdoor Movie Night Rental or Setup Services': '/uploads/events/event/Movie night.jpg',
      'Bachelorette & Bachelor Party Planner': '/uploads/events/event/Bachelor Party Planner.jpg',
      'Luxury Picnic Setup Services': '/uploads/events/event/Luxury Picnic.webp',
      'Professional Bridesmaid or Groomsman for Hire': '/uploads/events/event/Groomsman for Hire.jpg',
      'Wedding Officiant': '/uploads/events/event/weeding.webp',
      'Proposal Planner': '/uploads/events/event/Proposal Planner.jpg',
      'Live Band for Events': '/uploads/events/event/Live Band.jpg',
      'Photo Booth Rental': '/uploads/events/event/photo both.avif',
      'Security for Events': '/uploads/events/event/sequrity.jpg',
      'Bartender for Hire': '/uploads/events/event/Bartender.jpg',
      'Clown & Children\'s Entertainment': '/uploads/events/event/Clown.jpg',
      'Party Magician': '/uploads/events/event/Magician.jpg',
      'Face Painter': '/uploads/events/event/Painter.jpg',
      'Balloon Artist': '/uploads/events/event/ballon.jpg',
      'Cake Designer / Baker': '/uploads/events/event/Cake Designer.jpg',
      'Caterer': '/uploads/events/event/Caterer.jpg',
      'Event Decorator': '/uploads/events/event/Decorator.jpg',
      'Wedding Planner': '/uploads/events/event/Wedding Planner.jpg',
      'DJ / Musician for Events': '/uploads/events/event/DJ.jpg',
      'Photographer': '/uploads/events/event/photographer.avif'
    };

    const categoriesData = [
      {
        name: 'Other/ Miscellaneous',
        type: 'SERVICE',
        image: categoryImageMap['Miscellaneous Services'],
        subcategories: ['Holiday Light Installation/ Removal', 'Christmas Tree Delivery & Setup', 'Firewood Delivery',
          'Gutter Cleaning', 'Bouncy House Rental', 'Costume Designer', 'Drone Videography',
          'Rent a Buddy (Workout Buddy, Business Events, Gala, etc.)', 'Gig & Side Hustles',
          'Personal Delivery Driver', 'Food Truck Services', 'eBay / Amazon Product Lister',
          'Mystery Shopper', 'House Sitter', 'Other']
      },
      {
        name: 'Business & Professional Services',
        type: 'SERVICE',
        image: categoryImageMap['Business & Professional Services'],
        subcategories: ['Business Consultant', 'Virtual Assistant', 'Social Media Management', 'SEO & Digital Marketing Services',
          'Graphic Design', 'Website Development', 'Logo & Branding Services', 'IT Support & Tech Services',
          'Copywriting & Content Writing', 'Video Editing', 'Podcast Editing', 'Business Plan Writing',
          'Legal Consulting', 'Accounting & Bookkeeping', 'Notary Public', 'Grant Writing Services',
          'Public Relations Consultant', 'Other']
      },
      {
        name: 'Language Services',
        type: 'SERVICE',
        image: categoryImageMap['Language Services'],
        subcategories: ['Learn Twi', 'Learn Spanish', 'Learn French', 'Learn Ga', 'Learn Urdu', 'Learn Bengali',
          'Learn Arabic', 'Learn Chinese Mandarin', 'Other']
      },
      {
        name: 'Eco-Friendly & Sustainable Professions',
        type: 'SERVICE',
        image: categoryImageMap['Eco-Friendly & Sustainable Professions'],
        subcategories: ['Upcycling Artist', 'Composting Consultant', 'Sustainable Living Coach', 'Green Roof Designer',
          'Zero-Waste Event Planner', 'Other']
      },
      {
        name: 'Tech & Digital Professions',
        type: 'SERVICE',
        image: categoryImageMap['Tech & Digital Professions'],
        subcategories: ['AI Prompt Engineer', 'Virtual Reality (VR) Experience Designer', 'Droneographer', '3D Modeler',
          'Game Tester', 'NFT Artist', 'Chatbot Designer', 'Augmented Reality (AR) Developer', 'Other']
      },
      {
        name: 'Outdoor & Adventure Professions',
        type: 'SERVICE',
        image: categoryImageMap['Outdoor & Adventure Professions'],
        subcategories: ['Geocaching Guide', 'Survival Skills Instructor', 'Treehouse Builder', 'Falconry Trainer',
          'Urban Explorer Guide', 'Stargazing Guide', 'Other']
      },
      {
        name: 'Automotive Services',
        type: 'SERVICE',
        image: categoryImageMap['Automotive Services'],
        subcategories: ['Car Repair / Mechanic', 'Auto Body Repair', 'Car Detailing', 'Mobile Mechanic',
          'Motorcycle Repair', 'Tire Repair & Replacement', 'Windshield Repair & Replacement',
          'Car Audio & Electronics Installation', 'Towing Services', 'Car Wrapping / Customization',
          'RV Repair', 'Boat Repair', 'Other']
      },
      {
        name: 'Fitness & Sports Coaching',
        type: 'SERVICE',
        image: categoryImageMap['Fitness & Sports Coaching'],
        subcategories: ['Boxing Coach', 'Basketball Coach', 'Soccer Trainer', 'Self Defense Instructor',
          'Martial Arts Instructor', 'Swim Instructor', 'Henna Artist', 'Personal Driver', 'Travel Agent', 'Other']
      },
      {
        name: 'Childcare & Senior Care',
        type: 'SERVICE',
        image: categoryImageMap['Childcare & Senior Care'],
        subcategories: ['Babysitter', 'Nanny Services', 'Elderly Companion Care', 'Special Needs Caregiver',
          'Doula Services', 'Other']
      },
      {
        name: 'Music & Entertainment Services',
        type: 'SERVICE',
        image: categoryImageMap['Music & Entertainment Services'],
        subcategories: ['Voiceover Artist', 'Karaoke DJ', 'Sound Engineer', 'Music Producer', 'Band Manager', 'Other']
      },
      {
        name: 'Miscellaneous Unique Professions',
        type: 'SERVICE',
        image: categoryImageMap['Miscellaneous Unique Professions'],
        subcategories: ['Professional Sleeper', 'Mystery Novelist', 'Professional Dungeon Master', 'Hologram Designer', 'Other']
      },
      {
        name: 'Beauty & Personal Care Services',
        type: 'SERVICE',
        image: categoryImageMap['Beauty & Personal Care Services'],
        subcategories: ['Hair Stylist', 'Barber', 'Makeup Artist', 'Nail Technician / Manicurist',
          'Eyebrow & Eyelash Technician', 'Esthetician / Facial Services', 'Waxing & Hair Removal',
          'Body Contouring Specialist', 'Massage Therapy', 'Personal Stylist / Wardrobe Consultant',
          'Mobile Spa Services', 'Loctician (Specialist)', 'Cosmetic Tattooing (Microblading, Lip Blushing)',
          'Skincare Consultant', 'Scalp Treatment Specialist (Dandruff & Hair Loss)', 'Mobile Barber Services',
          'Holistic Beauty Consultant', 'Bridal Hair & Makeup Specialist', 'Henna Brow Tinting',
          'Mobile Spray Tan Specialist', 'Other']
      },
      {
        name: 'Elderly & Disability Services',
        type: 'SERVICE',
        image: categoryImageMap['Elderly & Disability Services'],
        subcategories: ['Wheelchair Ramp Installation', 'Home Accessibility Modifications',
          'Braille & Sign Language Interpreter', 'Elderly Computer Literacy Coach', 'Other']
      },
      {
        name: 'Business & Marketing Professions',
        type: 'SERVICE',
        image: categoryImageMap['Business & Marketing Professions'],
        subcategories: ['Brand Namer', 'Jingle Writer', 'Crowdfunding Consultant', 'Podcast Producer',
          'E-Commerce Niche Finder', 'Resume Writer', 'LinkedIn Profile Writer', 'Other']
      },
      {
        name: 'Unique & Niche Professions',
        type: 'SERVICE',
        image: categoryImageMap['Unique & Niche Professions'],
        subcategories: ['Professional Apologist', 'Time Capsule Creator', 'Memory Box Curator', 'Laughter Yoga Instructor',
          'Professional Whistler', 'Celebrity Impersonator', 'Professional Line Stander', 'Ethical Hacker',
          'Digital File Organizer', 'Custom Perfume Maker', 'Professional Gift Wrapper', 'Balloon Artist',
          'Pet Food Taster', 'Other']
      },
      {
        name: 'Educational & Tutoring Services',
        type: 'SERVICE',
        image: categoryImageMap['Educational & Tutoring Services'],
        subcategories: ['Piano Lessons', 'Guitar Lessons', 'Drum Lessons', 'Violin Lessons', 'Vocal / Singing Coach',
          'Art Lessons (Painting, Drawing, Sculpting)', 'Dance Instructor (Ballet, Hip-Hop, Salsa, etc.)',
          'Acting / Drama Coach', 'Language Tutor (Spanish, French, Chinese, etc.)', 'Math Tutor', 'Science Tutor',
          'SAT / ACT Prep Tutor', 'College Admissions Consultant', 'Special Needs Tutor', 'Public Speaking Coach',
          'Study Skills & Time Management Coach', 'Other']
      },
      {
        name: 'Food & Beverage Professions',
        type: 'SERVICE',
        image: categoryImageMap['Food & Beverage Professions'],
        subcategories: ['Food Stylist', 'Beverage Consultant', 'Chocolate Sculptor', 'Foraging Guide',
          'Tea Sommelier', 'Cake Sculptor', 'Food Taster', 'Other']
      },
      {
        name: 'Event & Entertainment Professions',
        type: 'SERVICE',
        image: categoryImageMap['Event & Entertainment Professions'],
        subcategories: ['Escape Room Designer', 'Party Motivator', 'Historical Reenactor', 'Voice Actor',
          'Puppeteer', 'Stand-Up Comedy Writer', 'Costume Designer', 'Escape Artist', 'Other']
      },
      {
        name: 'Handmade & Custom Creations',
        type: 'SERVICE',
        image: categoryImageMap['Handmade & Custom Creations'],
        subcategories: ['Custom Jewelry Maker', 'Custom Candle Maker', 'Woodworking & Custom Furniture',
          'Crochet/Knitting', 'Organic Handmade Soaps/ Creams', 'Seamstress', 'Other']
      },
      {
        name: 'Personal & Lifestyle Services',
        type: 'SERVICE',
        image: categoryImageMap['Personal & Lifestyle Services'],
        subcategories: ['Personal Shopper', 'Meal Prep Services', 'Fashion Designer / Tailor', 'Shoe Repair',
          'Resume Writing Services', 'Speech Therapist', 'Genealogy Research', 'Luxury and Personal Concierge Services',
          'Cooking Lessons', 'Other']
      },
      {
        name: 'Creative & Artistic',
        type: 'SERVICE',
        image: categoryImageMap['Creative & Artistic'],
        subcategories: ['Caricature Artist', 'Storyboard Artist', 'Muralist', 'Comic Book Illustrator',
          'Graffiti Artist', 'Tattoo Designer', 'Pet Portrait Artist', 'Fantasy Map Illustrator',
          'Calligrapher', 'Digital Matte Painter', 'Other']
      },
      {
        name: 'Security & Safety Services',
        type: 'SERVICE',
        image: categoryImageMap['Security & Safety Services'],
        subcategories: ['Private Investigator', 'Security Guard for Events', 'Cybersecurity Services',
          'Home Security System Installation', 'Personal Bodyguard', 'Other']
      },
      {
        name: 'Legal & Financial Services',
        type: 'SERVICE',
        image: categoryImageMap['Legal & Financial Services'],
        subcategories: ['Tax Preparer', 'Mortgage Broker', 'Debt Counselor', 'Financial Planner',
          'Legal Consulting', 'Other']
      },
      {
        name: 'Health & Wellness',
        type: 'SERVICE',
        image: categoryImageMap['Health & Wellness'],
        subcategories: ['Personal Trainer', 'Mindfulness & Stress Reduction Coaching', 'Yoga Instructor',
          'Pilates Instructor', 'Meditation Coach', 'Health Coach', 'Nutritionist / Dietitian',
          'Herbal / Juicing Consultant', 'Ayurvedic Health Consultant', 'Counselors / Therapist',
          'Life Coach', 'Weight Loss Consultant', 'Chiropractic Services', 'Stretch Specialist',
          'Mental Health Counselor', 'Hypnotherapist', 'Sound Therapy', 'Art Therapist',
          'Relationship Coach', 'Other']
      },
      {
        name: 'Event Services',
        type: 'SERVICE',
        image: categoryImageMap['Event Services'],
        subcategories: ['Photographer', 'Videographer', 'DJ / Musician for Events', 'Wedding Planner',
          'Event Decorator', 'Caterer', 'Cake Designer / Baker', 'Balloon Artist', 'Face Painter',
          'Party Magician', 'Clown & Children\'s Entertainment', 'Bartender for Hire', 'Security for Events',
          'Photo Booth Rental', 'Live Band for Events', 'Proposal Planner', 'Wedding Officiant',
          'Professional Bridesmaid or Groomsman for Hire', 'Luxury Picnic Setup Services',
          'Bachelorette & Bachelor Party Planner', 'Outdoor Movie Night Rental or Setup Services',
          'Personal Tour Guides', 'Other']
      },
      {
        name: 'Real Estate & Moving Services',
        type: 'SERVICE',
        image: categoryImageMap['Real Estate & Moving Services'],
        subcategories: ['Realtor Services', 'Property Management', 'Home Staging', 'Moving Services',
          'Junk Hauling', 'Packing & Unpacking Services', 'Furniture Assembly', 'Lawn & Garden Services',
          'Landscaping', 'Lawn Mowing', 'Tree Trimming & Removal', 'Gardening', 'Sprinkler Installation & Repair',
          'Snow Removal', 'Fence Installation & Repair', 'Deck & Patio Services', 'Other']
      },
      {
        name: 'Technology & Electronics',
        type: 'SERVICE',
        image: categoryImageMap['Technology & Electronics'],
        subcategories: ['Computer Repair', 'Phone Repair', 'Data Recovery Services', 'IT Consulting',
          'Smart Home Setup', '3D Printing Services', 'Other']
      },
      {
        name: 'Writing & Publishing Services',
        type: 'SERVICE',
        image: categoryImageMap['Writing & Publishing Services'],
        subcategories: ['Ghostwriting', 'Resume Writing', 'Scriptwriting Services', 'Editing & Proofreading',
          'Translation Services', 'Other']
      },
      {
        name: 'Lifestyle & Personal Services',
        type: 'SERVICE',
        image: categoryImageMap['Lifestyle & Personal Services'],
        subcategories: ['Personal Historian', 'Happiness Coach', 'Other']
      },
      {
        name: 'Cleaning & Maintenance Services',
        type: 'SERVICE',
        image: categoryImageMap['Cleaning & Maintenance Services'],
        subcategories: ['House Cleaning', 'Commercial Cleaning', 'Carpet & Upholstery Cleaning', 'Window Cleaning',
          'Power Washing', 'Laundry & Ironing Services', 'Junk Removal', 'Pool Cleaning',
          'Home Sanitation & Disinfection Services', 'Hoarding Cleanup', 'Home Organization', 'Other']
      },
      {
        name: 'Pet Services',
        type: 'SERVICE',
        image: categoryImageMap['Pet Services'],
        subcategories: ['Dog Walker', 'Pet Groomer', 'Pet Sitter', 'Pet Trainer', 'Mobile Pet Grooming',
          'Animal Behavior Specialist', 'Dog Waste Cleanup', 'Other']
      },
      {
        name: 'Home Improvement & Repair Services',
        type: 'SERVICE',
        image: categoryImageMap['Home Improvement & Repair Services'],
        subcategories: ['Plumbing', 'Electrical Work', 'Painting', 'Kitchen Remodeling / Bathroom Remodeling',
          'Handyman Services', 'Carpentry', 'Roofing', 'Flooring Installation & Repair',
          'HVAC (Heating, Ventilation, Air Conditioning)', 'Drywall & Plaster Repair', 'Appliance Repair',
          'Water Damage Restoration', 'Pest Control', 'Home Security Installation', 'Smart Home Setup',
          'Window & Door Installation', 'Locksmith Services', 'Garage Door Repair', 'Home Theater Installation',
          'Home Organization / Decluttering', 'Garage Makeovers', 'Home Soundproofing Expert',
          'Solar Panel Installation & Maintenance', 'Basement Waterproofing Specialist',
          'Wallpaper Installation & Removal', 'Exterior House Painting', 'Other']
      }
    ];

    // Event Categories

    const eventCategoriesData = [
      {
        name: 'Photographer',
        type: 'EVENT',
        image: eventCategoryImageMap['Photographer']
      },
      {
        name: 'DJ / Musician for Events',
        type: 'EVENT',
        image: eventCategoryImageMap['DJ / Musician for Events']
      },
      {
        name: 'Wedding Planner',
        type: 'EVENT',
        image: eventCategoryImageMap['Wedding Planner']
      },
      {
        name: 'Event Decorator',
        type: 'EVENT',
        image: eventCategoryImageMap['Event Decorator']
      },
      {
        name: 'Caterer',
        type: 'EVENT',
        image: eventCategoryImageMap['Caterer']
      },
      {
        name: 'Cake Designer / Baker',
        type: 'EVENT',
        image: eventCategoryImageMap['Cake Designer / Baker']
      },
      {
        name: 'Balloon Artist',
        type: 'EVENT',
        image: eventCategoryImageMap['Balloon Artist']
      },
      {
        name: 'Face Painter',
        type: 'EVENT',
        image: eventCategoryImageMap['Face Painter']
      },
      {
        name: 'Party Magician',
        type: 'EVENT',
        image: eventCategoryImageMap['Party Magician']
      },
      {
        name: 'Clown & Children\'s Entertainment',
        type: 'EVENT',
        image: eventCategoryImageMap['Clown & Children\'s Entertainment']
      },
      {
        name: 'Bartender for Hire',
        type: 'EVENT',
        image: eventCategoryImageMap['Bartender for Hire']
      },
      {
        name: 'Security for Events',
        type: 'EVENT',
        image: eventCategoryImageMap['Security for Events']
      },
      {
        name: 'Photo Booth Rental',
        type: 'EVENT',
        image: eventCategoryImageMap['Photo Booth Rental']
      },
      {
        name: 'Live Band for Events',
        type: 'EVENT',
        image: eventCategoryImageMap['Live Band for Events']
      },
      {
        name: 'Proposal Planner',
        type: 'EVENT',
        image: eventCategoryImageMap['Proposal Planner']
      },
      {
        name: 'Wedding Officiant',
        type: 'EVENT',
        image: eventCategoryImageMap['Wedding Officiant']
      },
      {
        name: 'Professional Bridesmaid or Groomsman for Hire',
        type: 'EVENT',
        image: eventCategoryImageMap['Professional Bridesmaid or Groomsman for Hire']
      },
      {
        name: 'Luxury Picnic Setup Services',
        type: 'EVENT',
        image: eventCategoryImageMap['Luxury Picnic Setup Services']
      },
      {
        name: 'Bachelorette & Bachelor Party Planner',
        type: 'EVENT',
        image: eventCategoryImageMap['Bachelorette & Bachelor Party Planner']
      },
      {
        name: 'Outdoor Movie Night Rental or Setup Services',
        type: 'EVENT',
        image: eventCategoryImageMap['Outdoor Movie Night Rental or Setup Services']
      },
      {
        name: 'Personal Tour Guides',
        type: 'EVENT',
        image: eventCategoryImageMap['Personal Tour Guides']
      },
      {
        name: 'Videographer',
        type: 'EVENT',
        image: eventCategoryImageMap['Videographer']
      }
      ,{
        name: 'Other',
        type: 'EVENT',
        image: eventCategoryImageMap['Other']
      }
    ];

    // Reverse event categories so 'Other' appears first and 'Photographer' last
    eventCategoriesData.reverse();

    for (const catData of categoriesData) {
      const category = await prisma.category.upsert({
        where: { name: catData.name },
        update: {
          image: catData.image
        },
        create: {
          name: catData.name,
          type: catData.type,
          image: catData.image
        }
      });

      // Create subcategories if they don't already exist (avoid deletions)
      for (const subName of catData.subcategories) {
        const existing = await prisma.subCategory.findFirst({
          where: { name: subName, categoryId: category.id }
        });
        if (!existing) {
          await prisma.subCategory.create({
            data: { name: subName, categoryId: category.id }
          });
        }
      }
    }

    console.log('✅ Categories and subcategories created');

    // Create Event Categories (no subcategories)
    for (const eventCat of eventCategoriesData) {
      await prisma.category.upsert({
        where: { name: eventCat.name },
        update: {
          image: eventCat.image
        },
        create: {
          name: eventCat.name,
          type: eventCat.type,
          image: eventCat.image
        }
      });
    }

    console.log('✅ Event categories created');

  console.log("✅ Admin user created");
  console.log("   Email: admin@sidegurus.com");
  console.log("   Password: admin123\n");

  console.log("✨ Database seeding completed successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  