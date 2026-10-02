// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Product from "./models/Product.js";

// dotenv.config();

// const products = [
//   {
//     title: "Wireless Bluetooth Headphones",
//     price: 49.99,
//     category: "electronics",
//     image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
//       "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500",
//       "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
//     ],
//     description:
//       "Over-ear wireless headphones with active noise cancellation and 30-hour battery life.",
//     rating: 4.5,
//     stock: 25,
//   },
//   {
//     title: "Smart Watch Series 5",
//     price: 129.99,
//     category: "electronics",
//     image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
//       "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500",
//       "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
//     ],
//     description: "Fitness tracking smartwatch with heart rate monitor and GPS.",
//     rating: 4.3,
//     stock: 18,
//   },
//   {
//     title: "Portable Bluetooth Speaker",
//     price: 35.5,
//     category: "electronics",
//     image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500",
//       "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
//       "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500",
//     ],
//     description:
//       "Waterproof portable speaker with deep bass and 12-hour playtime.",
//     rating: 4.1,
//     stock: 40,
//   },
//   {
//     title: "Men's Running Shoes",
//     price: 79.99,
//     category: "fashion",
//     image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
//       "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500",
//       "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500",
//     ],
//     description:
//       "Lightweight running shoes with breathable mesh and cushioned sole.",
//     rating: 4.4,
//     stock: 32,
//   },
//   {
//     title: "Women's Denim Jacket",
//     price: 59.99,
//     category: "fashion",
//     image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
//       "https://images.unsplash.com/photo-1551028719-001b00a23e0e?w=500",
//       "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=500",
//     ],
//     description: "Classic denim jacket, perfect for layering in any season.",
//     rating: 4.2,
//     stock: 22,
//   },
//   {
//     title: "Leather Crossbody Bag",
//     price: 89.0,
//     category: "fashion",
//     image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500",
//       "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
//       "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500",
//     ],
//     description: "Genuine leather crossbody bag with adjustable strap.",
//     rating: 4.6,
//     stock: 15,
//   },
//   {
//     title: "Stainless Steel Cookware Set",
//     price: 149.99,
//     category: "home",
//     image: "https://images.unsplash.com/photo-1584990347449-39b5b9bf67b6?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1584990347449-39b5b9bf67b6?w=500",
//       "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=500",
//       "https://images.unsplash.com/photo-1584990347449-39b5b9bf67b6?w=500",
//     ],
//     description: "10-piece stainless steel cookware set, dishwasher safe.",
//     rating: 4.7,
//     stock: 10,
//   },
//   {
//     title: "Aromatherapy Diffuser",
//     price: 24.99,
//     category: "home",
//     image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500",
//       "https://images.unsplash.com/photo-1602910344008-22f323cc1817?w=500",
//       "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500",
//     ],
//     description: "Ultrasonic essential oil diffuser with LED mood lighting.",
//     rating: 4.0,
//     stock: 50,
//   },
//   {
//     title: "Memory Foam Pillow",
//     price: 19.99,
//     category: "home",
//     image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500",
//       "https://images.unsplash.com/photo-1629949009765-40fc74c9ce72?w=500",
//       "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500",
//     ],
//     description: "Ergonomic memory foam pillow for better neck support.",
//     rating: 4.3,
//     stock: 60,
//   },
//   {
//     title: "Yoga Mat Premium",
//     price: 29.99,
//     category: "sports",
//     image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
//       "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500",
//       "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
//     ],
//     description: "Non-slip eco-friendly yoga mat with carrying strap.",
//     rating: 4.5,
//     stock: 35,
//   },
//   {
//     title: "Adjustable Dumbbell Set",
//     price: 119.99,
//     category: "sports",
//     image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500",
//       "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500",
//       "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500",
//     ],
//     description: "Space-saving adjustable dumbbells, 5-25kg per hand.",
//     rating: 4.6,
//     stock: 12,
//   },
//   {
//     title: "Cycling Helmet",
//     price: 39.99,
//     category: "sports",
//     image: "https://images.unsplash.com/photo-1557803175-2a59a9c1dd1f?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1557803175-2a59a9c1dd1f?w=500",
//       "https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?w=500",
//       "https://images.unsplash.com/photo-1557803175-2a59a9c1dd1f?w=500",
//     ],
//     description:
//       "Lightweight cycling helmet with adjustable fit and ventilation.",
//     rating: 4.2,
//     stock: 28,
//   },
//   {
//     title: "Mechanical Gaming Keyboard",
//     price: 69.99,
//     category: "electronics",
//     image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
//       "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
//       "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
//     ],
//     description: "RGB backlit mechanical keyboard with blue switches.",
//     rating: 4.4,
//     stock: 20,
//   },
//   {
//     title: "Ceramic Plant Pot Set",
//     price: 22.5,
//     category: "home",
//     image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500",
//       "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500",
//       "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500",
//     ],
//     description:
//       "Set of 3 ceramic plant pots with drainage holes, various sizes.",
//     rating: 4.1,
//     stock: 45,
//   },
//   {
//     title: "Men's Classic Sunglasses",
//     price: 34.99,
//     category: "fashion",
//     image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
//     images: [
//       "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
//       "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500",
//       "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
//     ],
//     description: "UV-protected polarized sunglasses with classic frame design.",
//     rating: 4.3,
//     stock: 38,
//   },
// ];

// const seedDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     // console.log("MongoDB Connected");

//     await Product.deleteMany({});
//     // console.log("Old products deleted");

//     await Product.insertMany(products);
//     // console.log("Products seeded successfully");

//     mongoose.connection.close();
//     // console.log("Database connection closed");
//   } catch (error) {
//     console.log("Seed Error:", error);
//     mongoose.connection.close();
//   }
// };

// seedDB();
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

// ============================================
// مجموعات الصور لكل فئة (بنكررها بالتناوب على المنتجات)
// ============================================
const electronicsImages = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500",
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
  "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500",
  "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500",
  "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
  "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
];

const fashionImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
  "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500",
  "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=500",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500",
];

const homeImages = [
  "https://images.unsplash.com/photo-1584990347449-39b5b9bf67b6?w=500",
  "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500",
  "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500",
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500",
  "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=500",
  "https://images.unsplash.com/photo-1602910344008-22f323cc1817?w=500",
  "https://images.unsplash.com/photo-1629949009765-40fc74c9ce72?w=500",
  "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=500",
];

const sportsImages = [
  "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
  "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500",
  "https://images.unsplash.com/photo-1557803175-2a59a9c1dd1f?w=500",
  "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500",
  "https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?w=500",
  "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500",
];

// ============================================
// دالة مساعدة: بتاخد اسم الفئة ومجموعة صورها وقائمة بيانات المنتجات (بدون صور)
// وبترجع array كامل من المنتجات جاهزة للحفظ، مع توزيع الصور بالتناوب
// ============================================
const buildCategoryProducts = (categoryName, imagePool, items) => {
  return items.map((item, index) => {
    // بنختار صورة رئيسية بالتناوب من المجموعة حسب ترتيب المنتج
    const mainImage = imagePool[index % imagePool.length];
    // وبنبني مصفوفة 3 صور (رئيسية + اتنين تانيين من نفس المجموعة) عشان الـ Gallery في صفحة التفاصيل
    const gallery = [
      mainImage,
      imagePool[(index + 1) % imagePool.length],
      imagePool[(index + 2) % imagePool.length],
    ];

    return {
      title: item.title,
      price: item.price,
      category: categoryName,
      image: mainImage,
      images: gallery,
      description: item.description,
      rating: item.rating,
      stock: item.stock,
    };
  });
};

// ============================================
// بيانات المنتجات: 25 منتج لكل فئة (بدون صور، هنضيفها بالدالة فوق)
// ============================================

const electronicsItems = [
  {
    title: "Wireless Bluetooth Headphones",
    price: 49.99,
    rating: 4.5,
    stock: 25,
    description:
      "Over-ear wireless headphones with active noise cancellation and 30-hour battery life.",
  },
  {
    title: "Smart Watch Series 5",
    price: 129.99,
    rating: 4.3,
    stock: 18,
    description: "Fitness tracking smartwatch with heart rate monitor and GPS.",
  },
  {
    title: "Portable Bluetooth Speaker",
    price: 35.5,
    rating: 4.1,
    stock: 40,
    description:
      "Waterproof portable speaker with deep bass and 12-hour playtime.",
  },
  {
    title: "Mechanical Gaming Keyboard",
    price: 69.99,
    rating: 4.4,
    stock: 20,
    description: "RGB backlit mechanical keyboard with blue switches.",
  },
  {
    title: "Wireless Gaming Mouse",
    price: 39.99,
    rating: 4.3,
    stock: 30,
    description:
      "Ergonomic wireless mouse with adjustable DPI and long battery life.",
  },
  {
    title: "4K Ultra HD Webcam",
    price: 54.99,
    rating: 4.2,
    stock: 22,
    description:
      "Crystal clear 4K webcam with built-in noise-cancelling microphone.",
  },
  {
    title: "Noise Cancelling Earbuds",
    price: 89.99,
    rating: 4.6,
    stock: 28,
    description:
      "True wireless earbuds with active noise cancellation and charging case.",
  },
  {
    title: "Portable Power Bank 20000mAh",
    price: 29.99,
    rating: 4.4,
    stock: 55,
    description:
      "High-capacity power bank with fast charging for phones and tablets.",
  },
  {
    title: "Smart Home Security Camera",
    price: 59.99,
    rating: 4.3,
    stock: 26,
    description:
      "1080p smart camera with night vision and motion detection alerts.",
  },
  {
    title: "USB-C Fast Charger 65W",
    price: 24.99,
    rating: 4.5,
    stock: 60,
    description:
      "Compact fast charger compatible with laptops, tablets, and phones.",
  },
  {
    title: "Bluetooth Fitness Tracker Band",
    price: 44.99,
    rating: 4.1,
    stock: 33,
    description:
      "Slim fitness band with step counter, sleep tracking, and notifications.",
  },
  {
    title: "Wireless Charging Pad",
    price: 19.99,
    rating: 4.0,
    stock: 48,
    description:
      "Fast wireless charging pad compatible with all Qi-enabled devices.",
  },
  {
    title: "Laptop Cooling Stand",
    price: 32.99,
    rating: 4.2,
    stock: 24,
    description:
      "Adjustable ergonomic laptop stand with built-in cooling fans.",
  },
  {
    title: "Portable Mini Projector",
    price: 149.99,
    rating: 4.3,
    stock: 12,
    description:
      "Compact HD projector perfect for home movie nights and presentations.",
  },
  {
    title: "Smart LED Light Bulbs (4-Pack)",
    price: 27.99,
    rating: 4.4,
    stock: 45,
    description:
      "Wi-Fi enabled color-changing smart bulbs, controllable via app.",
  },
  {
    title: "Gaming Headset with Mic",
    price: 45.99,
    rating: 4.3,
    stock: 27,
    description:
      "Surround sound gaming headset with noise-cancelling microphone.",
  },
  {
    title: "External SSD 1TB",
    price: 89.99,
    rating: 4.7,
    stock: 19,
    description: "Ultra-fast portable SSD with USB-C connectivity.",
  },
  {
    title: "Wireless Earphones Sport Edition",
    price: 34.99,
    rating: 4.2,
    stock: 38,
    description: "Sweat-resistant wireless earphones designed for workouts.",
  },
  {
    title: "Digital Kitchen Scale Smart",
    price: 18.99,
    rating: 4.1,
    stock: 42,
    description:
      "Precision digital scale with smartphone app nutrition tracking.",
  },
  {
    title: "Bluetooth Car Adapter",
    price: 15.99,
    rating: 4.0,
    stock: 50,
    description:
      "Hands-free car adapter with FM transmitter and dual USB ports.",
  },
  {
    title: "Smart Plug Wi-Fi Enabled",
    price: 12.99,
    rating: 4.2,
    stock: 65,
    description: "Control your appliances remotely with this Wi-Fi smart plug.",
  },
  {
    title: "Portable Bluetooth Mini Speaker",
    price: 22.99,
    rating: 4.0,
    stock: 44,
    description:
      "Compact speaker with surprisingly powerful sound for its size.",
  },
  {
    title: "HD Action Camera",
    price: 79.99,
    rating: 4.4,
    stock: 16,
    description:
      "Waterproof action camera with 4K recording and stabilization.",
  },
  {
    title: "Wireless Video Doorbell",
    price: 99.99,
    rating: 4.5,
    stock: 14,
    description:
      "Smart doorbell with HD video, two-way audio, and motion alerts.",
  },
  {
    title: "Tablet Stand Adjustable",
    price: 16.99,
    rating: 4.1,
    stock: 55,
    description:
      "Foldable adjustable stand compatible with most tablets and phones.",
  },
];

const fashionItems = [
  {
    title: "Men's Running Shoes",
    price: 79.99,
    rating: 4.4,
    stock: 32,
    description:
      "Lightweight running shoes with breathable mesh and cushioned sole.",
  },
  {
    title: "Women's Denim Jacket",
    price: 59.99,
    rating: 4.2,
    stock: 22,
    description: "Classic denim jacket, perfect for layering in any season.",
  },
  {
    title: "Leather Crossbody Bag",
    price: 89.0,
    rating: 4.6,
    stock: 15,
    description: "Genuine leather crossbody bag with adjustable strap.",
  },
  {
    title: "Men's Classic Sunglasses",
    price: 34.99,
    rating: 4.3,
    stock: 38,
    description: "UV-protected polarized sunglasses with classic frame design.",
  },
  {
    title: "Women's Summer Floral Dress",
    price: 45.99,
    rating: 4.5,
    stock: 26,
    description: "Lightweight floral dress, perfect for warm summer days.",
  },
  {
    title: "Men's Slim Fit Jeans",
    price: 54.99,
    rating: 4.2,
    stock: 30,
    description: "Comfortable slim fit jeans made from stretch denim.",
  },
  {
    title: "Women's Leather Ankle Boots",
    price: 74.99,
    rating: 4.4,
    stock: 20,
    description: "Stylish ankle boots crafted from genuine leather.",
  },
  {
    title: "Men's Casual Cotton T-Shirt",
    price: 19.99,
    rating: 4.1,
    stock: 60,
    description:
      "Soft breathable cotton t-shirt, available in multiple colors.",
  },
  {
    title: "Women's Knit Sweater",
    price: 42.99,
    rating: 4.3,
    stock: 28,
    description: "Cozy knit sweater perfect for cooler weather.",
  },
  {
    title: "Men's Leather Wallet",
    price: 29.99,
    rating: 4.5,
    stock: 40,
    description: "Slim genuine leather wallet with multiple card slots.",
  },
  {
    title: "Women's Silk Scarf",
    price: 24.99,
    rating: 4.2,
    stock: 35,
    description: "Elegant silk scarf with a delicate printed pattern.",
  },
  {
    title: "Men's Formal Dress Shirt",
    price: 39.99,
    rating: 4.3,
    stock: 25,
    description:
      "Wrinkle-resistant formal shirt suitable for office and events.",
  },
  {
    title: "Women's High-Waist Leggings",
    price: 27.99,
    rating: 4.4,
    stock: 50,
    description:
      "Stretchy high-waist leggings ideal for workouts or casual wear.",
  },
  {
    title: "Men's Bomber Jacket",
    price: 69.99,
    rating: 4.3,
    stock: 18,
    description: "Trendy bomber jacket with ribbed cuffs and hem.",
  },
  {
    title: "Women's Canvas Tote Bag",
    price: 32.99,
    rating: 4.1,
    stock: 44,
    description: "Durable canvas tote bag, great for everyday errands.",
  },
  {
    title: "Men's Sports Sneakers",
    price: 64.99,
    rating: 4.4,
    stock: 27,
    description: "Versatile sneakers designed for both sport and casual wear.",
  },
  {
    title: "Women's Wool Coat",
    price: 119.99,
    rating: 4.6,
    stock: 12,
    description: "Warm wool-blend coat with a timeless silhouette.",
  },
  {
    title: "Men's Baseball Cap",
    price: 17.99,
    rating: 4.0,
    stock: 55,
    description: "Adjustable cotton baseball cap with embroidered logo.",
  },
  {
    title: "Women's Hoop Earrings",
    price: 14.99,
    rating: 4.2,
    stock: 48,
    description:
      "Classic gold-tone hoop earrings, lightweight and hypoallergenic.",
  },
  {
    title: "Men's Leather Belt",
    price: 22.99,
    rating: 4.3,
    stock: 42,
    description: "Genuine leather belt with a classic buckle design.",
  },
  {
    title: "Women's Yoga Pants",
    price: 29.99,
    rating: 4.4,
    stock: 46,
    description: "Flexible yoga pants with a soft, breathable fabric blend.",
  },
  {
    title: "Men's Polo Shirt",
    price: 24.99,
    rating: 4.1,
    stock: 50,
    description: "Classic fit polo shirt made from breathable cotton pique.",
  },
  {
    title: "Women's Crossbody Wallet",
    price: 26.99,
    rating: 4.2,
    stock: 33,
    description: "Compact crossbody wallet with card and phone compartments.",
  },
  {
    title: "Men's Winter Beanie",
    price: 12.99,
    rating: 4.0,
    stock: 58,
    description: "Warm knit beanie, perfect for cold winter days.",
  },
  {
    title: "Women's Statement Necklace",
    price: 19.99,
    rating: 4.3,
    stock: 36,
    description: "Eye-catching statement necklace to elevate any outfit.",
  },
];

const homeItems = [
  {
    title: "Ceramic Plant Pot Set",
    price: 22.5,
    rating: 4.1,
    stock: 45,
    description:
      "Set of 3 ceramic plant pots with drainage holes, various sizes.",
  },
  {
    title: "Memory Foam Pillow",
    price: 19.99,
    rating: 4.3,
    stock: 60,
    description: "Ergonomic memory foam pillow for better neck support.",
  },
  {
    title: "Stainless Steel Cookware Set",
    price: 149.99,
    rating: 4.7,
    stock: 10,
    description: "10-piece stainless steel cookware set, dishwasher safe.",
  },
  {
    title: "Aromatherapy Diffuser",
    price: 24.99,
    rating: 4.0,
    stock: 50,
    description: "Ultrasonic essential oil diffuser with LED mood lighting.",
  },

  {
    title: "Non-Stick Frying Pan Set",
    price: 44.99,
    rating: 4.4,
    stock: 25,
    description: "3-piece non-stick frying pan set for everyday cooking.",
  },
  {
    title: "Cotton Bed Sheet Set Queen",
    price: 39.99,
    rating: 4.5,
    stock: 30,
    description: "Soft 100% cotton bed sheet set, includes pillowcases.",
  },
  {
    title: "LED Desk Lamp Adjustable",
    price: 27.99,
    rating: 4.3,
    stock: 38,
    description: "Adjustable LED desk lamp with multiple brightness settings.",
  },
  {
    title: "Kitchen Knife Set with Block",
    price: 59.99,
    rating: 4.6,
    stock: 18,
    description: "Professional-grade knife set with wooden storage block.",
  },
  {
    title: "Bamboo Cutting Board Set",
    price: 21.99,
    rating: 4.2,
    stock: 40,
    description: "Eco-friendly bamboo cutting boards, set of 3 sizes.",
  },
  {
    title: "Wall Clock Modern Design",
    price: 18.99,
    rating: 4.1,
    stock: 35,
    description: "Minimalist wall clock, silent sweep movement.",
  },
  {
    title: "Throw Blanket Soft Fleece",
    price: 25.99,
    rating: 4.4,
    stock: 42,
    description: "Ultra-soft fleece throw blanket, perfect for couch or bed.",
  },
  {
    title: "Glass Food Storage Containers",
    price: 32.99,
    rating: 4.3,
    stock: 28,
    description: "Set of 5 airtight glass containers, microwave and oven safe.",
  },
  {
    title: "Scented Candle Gift Set",
    price: 29.99,
    rating: 4.5,
    stock: 32,
    description: "Set of 4 scented soy candles in a beautiful gift box.",
  },
  {
    title: "Bathroom Towel Set 6-Piece",
    price: 34.99,
    rating: 4.4,
    stock: 26,
    description: "Plush cotton towel set including bath and hand towels.",
  },
  {
    title: "Coffee Maker Drip Machine",
    price: 49.99,
    rating: 4.3,
    stock: 20,
    description: "Programmable drip coffee maker with 12-cup capacity.",
  },
  {
    title: "Wooden Photo Frame Set",
    price: 16.99,
    rating: 4.0,
    stock: 48,
    description: "Set of 5 wooden picture frames in assorted sizes.",
  },
  {
    title: "Area Rug Living Room",
    price: 89.99,
    rating: 4.5,
    stock: 14,
    description: "Soft area rug that adds warmth and style to any room.",
  },
  {
    title: "Kitchen Storage Organizer",
    price: 23.99,
    rating: 4.2,
    stock: 36,
    description: "Stackable pantry organizer for efficient kitchen storage.",
  },
  {
    title: "Electric Kettle Stainless",
    price: 28.99,
    rating: 4.4,
    stock: 30,
    description: "Fast-boil stainless steel electric kettle, 1.7L capacity.",
  },
  {
    title: "Decorative Throw Pillow Covers",
    price: 15.99,
    rating: 4.1,
    stock: 55,
    description: "Set of 2 decorative pillow covers, machine washable.",
  },
  {
    title: "Air Purifier Compact",
    price: 79.99,
    rating: 4.5,
    stock: 16,
    description: "HEPA air purifier suitable for small to medium rooms.",
  },
  {
    title: "Shower Curtain Waterproof",
    price: 14.99,
    rating: 4.0,
    stock: 50,
    description: "Waterproof fabric shower curtain with reinforced grommets.",
  },
  {
    title: "Wall Mirror Round Decorative",
    price: 42.99,
    rating: 4.3,
    stock: 22,
    description: "Modern round wall mirror with a slim metal frame.",
  },
  {
    title: "Laundry Basket Foldable",
    price: 19.99,
    rating: 4.1,
    stock: 44,
    description: "Collapsible laundry basket, saves space when not in use.",
  },
  {
    title: "Table Runner Cotton",
    price: 12.99,
    rating: 4.0,
    stock: 52,
    description:
      "Elegant cotton table runner for everyday or special occasions.",
  },
];

const sportsItems = [
  {
    title: "Yoga Mat Premium",
    price: 29.99,
    rating: 4.5,
    stock: 35,
    description: "Non-slip eco-friendly yoga mat with carrying strap.",
  },
  {
    title: "Adjustable Dumbbell Set",
    price: 119.99,
    rating: 4.6,
    stock: 12,
    description: "Space-saving adjustable dumbbells, 5-25kg per hand.",
  },
  {
    title: "Cycling Helmet",
    price: 39.99,
    rating: 4.2,
    stock: 28,
    description:
      "Lightweight cycling helmet with adjustable fit and ventilation.",
  },
  {
    title: "Resistance Bands Set",
    price: 19.99,
    rating: 4.3,
    stock: 50,
    description: "Set of 5 resistance bands with varying tension levels.",
  },
  {
    title: "Jump Rope Speed Cable",
    price: 12.99,
    rating: 4.1,
    stock: 60,
    description: "Adjustable speed jump rope for cardio and HIIT workouts.",
  },
  {
    title: "Water Bottle Insulated 1L",
    price: 17.99,
    rating: 4.4,
    stock: 55,
    description: "Vacuum-insulated bottle that keeps drinks cold for 24 hours.",
  },
  {
    title: "Running Shorts Men's",
    price: 22.99,
    rating: 4.2,
    stock: 40,
    description: "Breathable running shorts with built-in liner.",
  },
  {
    title: "Foam Roller for Muscle Recovery",
    price: 24.99,
    rating: 4.3,
    stock: 32,
    description: "High-density foam roller for post-workout muscle recovery.",
  },
  {
    title: "Tennis Racket Beginner",
    price: 49.99,
    rating: 4.1,
    stock: 18,
    description:
      "Lightweight tennis racket ideal for beginners and intermediates.",
  },
  {
    title: "Basketball Official Size",
    price: 27.99,
    rating: 4.3,
    stock: 30,
    description:
      "Official size and weight basketball for indoor and outdoor use.",
  },
  {
    title: "Camping Tent 2-Person",
    price: 89.99,
    rating: 4.4,
    stock: 14,
    description: "Waterproof 2-person tent, easy setup for weekend camping.",
  },
  {
    title: "Hiking Backpack 40L",
    price: 64.99,
    rating: 4.5,
    stock: 20,
    description: "Durable hiking backpack with multiple compartments.",
  },
  {
    title: "Swim Goggles Anti-Fog",
    price: 14.99,
    rating: 4.2,
    stock: 48,
    description:
      "Anti-fog swim goggles with UV protection and adjustable strap.",
  },
  {
    title: "Fitness Gloves Weight Lifting",
    price: 16.99,
    rating: 4.1,
    stock: 42,
    description: "Padded gym gloves for extra grip and hand protection.",
  },
  {
    title: "Soccer Ball Match Quality",
    price: 24.99,
    rating: 4.3,
    stock: 36,
    description:
      "Match-quality soccer ball with durable stitched construction.",
  },
  {
    title: "Sports Duffel Bag",
    price: 34.99,
    rating: 4.2,
    stock: 26,
    description: "Spacious duffel bag with separate shoe compartment.",
  },
  {
    title: "Ankle Weights Set",
    price: 18.99,
    rating: 4.0,
    stock: 38,
    description: "Adjustable ankle weights for strength training exercises.",
  },
  {
    title: "Yoga Block Set",
    price: 13.99,
    rating: 4.2,
    stock: 45,
    description:
      "Set of 2 high-density foam yoga blocks for support and balance.",
  },
  {
    title: "Badminton Racket Set",
    price: 29.99,
    rating: 4.1,
    stock: 22,
    description:
      "Set of 2 badminton rackets with carrying bag and shuttlecocks.",
  },
  {
    title: "Sleeping Bag Lightweight",
    price: 44.99,
    rating: 4.4,
    stock: 16,
    description: "Compact lightweight sleeping bag for camping and hiking.",
  },
  {
    title: "Trekking Poles Adjustable",
    price: 32.99,
    rating: 4.3,
    stock: 24,
    description: "Collapsible aluminum trekking poles with ergonomic grips.",
  },
  {
    title: "Gym Workout Gloves",
    price: 15.99,
    rating: 4.0,
    stock: 40,
    description: "Breathable workout gloves with wrist support.",
  },
  {
    title: "Skipping Jump Rope Pro",
    price: 11.99,
    rating: 4.1,
    stock: 50,
    description: "Professional-grade jump rope with ball-bearing swivel.",
  },
  {
    title: "Elbow Support Brace",
    price: 9.99,
    rating: 4.0,
    stock: 55,
    description: "Compression elbow brace for pain relief and joint support.",
  },
  {
    title: "Sports Water Bottle Shaker",
    price: 8.99,
    rating: 4.1,
    stock: 60,
    description:
      "Leak-proof shaker bottle with mixing ball for protein shakes.",
  },
];

// ============================================
// تجميع المنتجات النهائي من كل الفئات
// ============================================
const products = [
  ...buildCategoryProducts("electronics", electronicsImages, electronicsItems),
  ...buildCategoryProducts("fashion", fashionImages, fashionItems),
  ...buildCategoryProducts("home", homeImages, homeItems),
  ...buildCategoryProducts("sports", sportsImages, sportsItems),
];

// ============================================
// Add missing demo products only. Never replace products managed by an admin.
// ============================================
const seedDB = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Seeding is disabled in production. Use the admin dashboard to manage products.");
    }
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
    const confirmedDatabase = process.argv.find((arg) => arg.startsWith("--confirm-db="))?.slice("--confirm-db=".length);
    if (!confirmedDatabase) throw new Error("Pass --confirm-db=DATABASE_NAME to seed the intended non-production database.");
    await mongoose.connect(process.env.MONGODB_URI);
    if (mongoose.connection.name !== confirmedDatabase) throw new Error(`Connected database is ${mongoose.connection.name}, not ${confirmedDatabase}; no products changed.`);
    console.log("MongoDB Connected");
    const result = await Product.bulkWrite(products.map((product) => ({
      updateOne: {
        filter: { title: product.title, category: product.category },
        update: { $setOnInsert: product },
        upsert: true,
      },
    })));
    console.log(`${result.upsertedCount} missing demo products added; existing products left untouched`);
  } catch (error) {
    console.error("Seed Error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDB();
