import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCm0FDaNw8nOkXDHQuC9HKl01ZUtPSsBQg',
  authDomain: 'in-demand-delivery-app.firebaseapp.com',
  projectId: 'in-demand-delivery-app',
  storageBucket: 'in-demand-delivery-app.firebasestorage.app',
  messagingSenderId: '106637930808',
  appId: '1:106637930808:web:9974be84e3af08938091cd',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
  console.log('Seeding Kali Marketplace data...\n');

  // Create vendor account
  let vendorUid;
  const vendorEmail = 'vendor@kali.com';
  const vendorPassword = 'vendor123';

  try {
    const cred = await createUserWithEmailAndPassword(auth, vendorEmail, vendorPassword);
    vendorUid = cred.user.uid;
    console.log('Created vendor account:', vendorEmail);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, vendorEmail, vendorPassword);
      vendorUid = cred.user.uid;
      console.log('Vendor account already exists, signed in:', vendorEmail);
    } else {
      throw e;
    }
  }

  // Create a second vendor account
  let vendor2Uid;
  const vendor2Email = 'vendor2@kali.com';
  try {
    const cred = await createUserWithEmailAndPassword(auth, vendor2Email, vendorPassword);
    vendor2Uid = cred.user.uid;
    console.log('Created vendor2 account:', vendor2Email);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, vendor2Email, vendorPassword);
      vendor2Uid = cred.user.uid;
      console.log('Vendor2 account already exists, signed in:', vendor2Email);
    } else {
      throw e;
    }
  }

  // Seed categories
  console.log('\nSeeding categories...');
  const categories = [
    { name: 'Restaurants', icon: 'restaurant', sortOrder: 0 },
    { name: 'Fast Food', icon: 'fastfood', sortOrder: 1 },
    { name: 'Groceries', icon: 'local_grocery_store', sortOrder: 2 },
    { name: 'Pharmacy', icon: 'local_pharmacy', sortOrder: 3 },
    { name: 'Bakery', icon: 'bakery_dining', sortOrder: 4 },
  ];

  // Check if categories already exist
  const existingCats = await getDocs(collection(db, 'categories'));
  if (existingCats.empty) {
    for (const cat of categories) {
      await addDoc(collection(db, 'categories'), cat);
      console.log('  + Category:', cat.name);
    }
  } else {
    console.log('  Categories already exist, skipping.');
  }

  // Seed vendors
  console.log('\nSeeding vendors...');
  const vendors = [
    {
      name: 'Mama Nkechi Kitchen',
      description: 'Authentic Nigerian dishes made with love',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      logoUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200',
      category: 'Restaurants',
      rating: 4.7,
      reviewCount: 234,
      prepTimeMinutes: 25,
      deliveryFee: 500,
      minOrder: 1500,
      isOpen: true,
      address: '12 Allen Avenue, Ikeja',
      tags: ['Nigerian', 'Local', 'Rice', 'Soup'],
      ownerId: vendorUid,
    },
    {
      name: 'Chicken Republic',
      description: 'Tasty chicken meals and fast food',
      imageUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600',
      logoUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=200',
      category: 'Fast Food',
      rating: 4.3,
      reviewCount: 456,
      prepTimeMinutes: 15,
      deliveryFee: 300,
      minOrder: 1000,
      isOpen: true,
      address: '5 Broad Street, Lagos Island',
      tags: ['Chicken', 'Fast Food', 'Burgers'],
      ownerId: vendorUid,
    },
    {
      name: 'Dominos Pizza',
      description: 'Fresh pizza delivered hot to your door',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
      logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
      category: 'Fast Food',
      rating: 4.5,
      reviewCount: 890,
      prepTimeMinutes: 30,
      deliveryFee: 0,
      minOrder: 3000,
      isOpen: true,
      address: '15 Admiralty Way, Lekki',
      tags: ['Pizza', 'Italian', 'Fast Food'],
      ownerId: vendor2Uid,
    },
    {
      name: 'Sweet Sensation',
      description: 'Nigerian fast food and pastries',
      imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
      logoUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200',
      category: 'Fast Food',
      rating: 4.1,
      reviewCount: 312,
      prepTimeMinutes: 20,
      deliveryFee: 400,
      minOrder: 800,
      isOpen: true,
      address: '8 Ogunlana Drive, Surulere',
      tags: ['Fast Food', 'Pastries', 'Nigerian'],
      ownerId: vendor2Uid,
    },
    {
      name: 'The Yellow Chilli',
      description: 'Premium Nigerian continental cuisine',
      imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      logoUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=200',
      category: 'Restaurants',
      rating: 4.8,
      reviewCount: 567,
      prepTimeMinutes: 35,
      deliveryFee: 700,
      minOrder: 3000,
      isOpen: true,
      address: '27 Adeola Odeku, Victoria Island',
      tags: ['Nigerian', 'Continental', 'Fine Dining'],
      ownerId: vendorUid,
    },
    {
      name: 'Shoprite Groceries',
      description: 'Fresh groceries and household items',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
      logoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200',
      category: 'Groceries',
      rating: 4.2,
      reviewCount: 145,
      prepTimeMinutes: 40,
      deliveryFee: 600,
      minOrder: 2000,
      isOpen: true,
      address: 'Palms Shopping Mall, Lekki',
      tags: ['Groceries', 'Supermarket', 'Fresh'],
      ownerId: vendor2Uid,
    },
  ];

  const vendorIds = [];
  for (const vendor of vendors) {
    const ref = await addDoc(collection(db, 'vendors'), vendor);
    vendorIds.push(ref.id);
    console.log('  + Vendor:', vendor.name, '(id:', ref.id + ')');
  }

  // Seed products
  console.log('\nSeeding products...');

  const allProducts = [
    // Mama Nkechi Kitchen (index 0)
    { vendorId: vendorIds[0], name: 'Jollof Rice & Chicken', description: 'Party-style jollof rice with grilled chicken', imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400', menuCategory: 'Rice Dishes', price: 2500, discountPrice: null, isAvailable: true, tags: ['Rice', 'Chicken'] },
    { vendorId: vendorIds[0], name: 'Fried Rice & Turkey', description: 'Special fried rice with seasoned turkey', imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', menuCategory: 'Rice Dishes', price: 3000, discountPrice: 2700, isAvailable: true, tags: ['Rice', 'Turkey'] },
    { vendorId: vendorIds[0], name: 'Egusi Soup with Pounded Yam', description: 'Rich egusi soup served with fluffy pounded yam', imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400', menuCategory: 'Soups & Swallow', price: 3500, discountPrice: null, isAvailable: true, tags: ['Soup', 'Swallow'] },
    { vendorId: vendorIds[0], name: 'Pepper Soup', description: 'Spicy goat meat pepper soup', imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', menuCategory: 'Soups & Swallow', price: 2000, discountPrice: null, isAvailable: true, tags: ['Soup', 'Spicy'] },
    { vendorId: vendorIds[0], name: 'Moi Moi', description: 'Steamed bean pudding with egg and fish', imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', menuCategory: 'Sides', price: 500, discountPrice: null, isAvailable: true, tags: ['Side'] },
    { vendorId: vendorIds[0], name: 'Chapman', description: 'Classic Nigerian cocktail drink', imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', menuCategory: 'Drinks', price: 800, discountPrice: null, isAvailable: true, tags: ['Drink'] },

    // Chicken Republic (index 1)
    { vendorId: vendorIds[1], name: 'Chicken Meal Box', description: '2pc chicken with rice, coleslaw and drink', imageUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400', menuCategory: 'Combo Meals', price: 3200, discountPrice: 2800, isAvailable: true, tags: ['Combo', 'Chicken'] },
    { vendorId: vendorIds[1], name: 'Chicken Burger', description: 'Crispy chicken fillet burger with fries', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', menuCategory: 'Burgers', price: 2200, discountPrice: null, isAvailable: true, tags: ['Burger'] },
    { vendorId: vendorIds[1], name: 'Shawarma', description: 'Loaded chicken shawarma wrap', imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400', menuCategory: 'Wraps', price: 1800, discountPrice: null, isAvailable: true, tags: ['Wrap', 'Shawarma'] },
    { vendorId: vendorIds[1], name: 'Chicken Wings (6pc)', description: 'Crispy fried chicken wings', imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400', menuCategory: 'Sides', price: 2000, discountPrice: null, isAvailable: true, tags: ['Sides', 'Chicken'] },

    // Dominos Pizza (index 2)
    { vendorId: vendorIds[2], name: 'Pepperoni Pizza (Large)', description: 'Classic pepperoni with mozzarella cheese', imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', menuCategory: 'Pizza', price: 7500, discountPrice: 6500, isAvailable: true, tags: ['Pizza'] },
    { vendorId: vendorIds[2], name: 'BBQ Chicken Pizza (Medium)', description: 'Grilled chicken, BBQ sauce, onions', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', menuCategory: 'Pizza', price: 5500, discountPrice: null, isAvailable: true, tags: ['Pizza', 'Chicken'] },
    { vendorId: vendorIds[2], name: 'Garlic Bread', description: 'Buttery garlic bread with herbs', imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400', menuCategory: 'Sides', price: 1200, discountPrice: null, isAvailable: true, tags: ['Side', 'Bread'] },
    { vendorId: vendorIds[2], name: 'Margherita Pizza (Medium)', description: 'Fresh tomato, mozzarella, basil', imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', menuCategory: 'Pizza', price: 4500, discountPrice: 3800, isAvailable: true, tags: ['Pizza', 'Vegetarian'] },

    // Sweet Sensation (index 3)
    { vendorId: vendorIds[3], name: 'Meat Pie', description: 'Golden baked meat pie', imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', menuCategory: 'Pastries', price: 600, discountPrice: null, isAvailable: true, tags: ['Pastry'] },
    { vendorId: vendorIds[3], name: 'Chicken Pie', description: 'Flaky pastry with chicken filling', imageUrl: 'https://images.unsplash.com/photo-1612169430583-0917e6fc0f67?w=400', menuCategory: 'Pastries', price: 700, discountPrice: null, isAvailable: true, tags: ['Pastry', 'Chicken'] },
    { vendorId: vendorIds[3], name: 'Doughnut (3pc)', description: 'Sugar glazed doughnuts', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', menuCategory: 'Pastries', price: 900, discountPrice: null, isAvailable: true, tags: ['Pastry', 'Sweet'] },
    { vendorId: vendorIds[3], name: 'Jollof Rice Combo', description: 'Jollof rice with chicken and plantain', imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400', menuCategory: 'Meals', price: 2200, discountPrice: 1900, isAvailable: true, tags: ['Rice', 'Combo'] },

    // The Yellow Chilli (index 4)
    { vendorId: vendorIds[4], name: 'Ofada Rice Special', description: 'Local ofada rice with designer stew', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400', menuCategory: 'Signature Dishes', price: 5000, discountPrice: null, isAvailable: true, tags: ['Rice', 'Signature'] },
    { vendorId: vendorIds[4], name: 'Grilled Catfish', description: 'Whole grilled catfish with spicy sauce', imageUrl: 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=400', menuCategory: 'Signature Dishes', price: 6500, discountPrice: 5500, isAvailable: true, tags: ['Fish', 'Grilled'] },
    { vendorId: vendorIds[4], name: 'Suya Platter', description: 'Assorted grilled meat with yaji spice', imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', menuCategory: 'Appetizers', price: 4000, discountPrice: null, isAvailable: true, tags: ['Grilled', 'Appetizer'] },
    { vendorId: vendorIds[4], name: 'Chapman Deluxe', description: 'Premium chapman cocktail', imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', menuCategory: 'Drinks', price: 1500, discountPrice: null, isAvailable: true, tags: ['Drink'] },

    // Shoprite Groceries (index 5)
    { vendorId: vendorIds[5], name: 'Fresh Tomatoes (1kg)', description: 'Locally sourced fresh tomatoes', imageUrl: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400', menuCategory: 'Vegetables', price: 1200, discountPrice: null, isAvailable: true, tags: ['Vegetables', 'Fresh'] },
    { vendorId: vendorIds[5], name: 'Basmati Rice (5kg)', description: 'Premium basmati rice', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', menuCategory: 'Grains', price: 8500, discountPrice: 7500, isAvailable: true, tags: ['Rice', 'Grains'] },
    { vendorId: vendorIds[5], name: 'Whole Chicken', description: 'Fresh whole chicken (1.5kg)', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400', menuCategory: 'Meat', price: 5500, discountPrice: null, isAvailable: true, tags: ['Meat', 'Chicken'] },
    { vendorId: vendorIds[5], name: 'Cooking Oil (3L)', description: 'Premium vegetable cooking oil', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', menuCategory: 'Essentials', price: 4500, discountPrice: 3900, isAvailable: true, tags: ['Oil', 'Essentials'] },
  ];

  for (const product of allProducts) {
    await addDoc(collection(db, 'products'), product);
    console.log('  + Product:', product.name);
  }

  console.log('\n--- Seeding complete! ---');
  console.log('\nVendor Login Credentials:');
  console.log('  Account 1: vendor@kali.com / vendor123');
  console.log('    Stores: Mama Nkechi Kitchen, Chicken Republic, The Yellow Chilli');
  console.log('  Account 2: vendor2@kali.com / vendor123');
  console.log('    Stores: Dominos Pizza, Sweet Sensation, Shoprite Groceries');
  console.log('\nVendor IDs:', vendorIds);

  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
