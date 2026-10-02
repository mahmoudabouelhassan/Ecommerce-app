// import Product from "../models/Product.js";

// const getProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.json(product);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export { getProducts, getProductById };

import Product from "../models/Product.js";
import { canonicalCategories, categoryFilter } from "../utils/categories.js";

const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 12,
      sort = "default",
    } = req.query;

    // بنبني query object ديناميكي حسب الفلاتر المتاحة
    const query = { archivedAt: null };

    if (category && category !== "all") {
      query.category = categoryFilter(category);
    }

    if (search) {
      // $regex بيعمل بحث "يحتوي على" مش تطابق تام، و $options: "i" بيتجاهل حالة الأحرف
      query.title = { $regex: search, $options: "i" };
    }

    let sortOption = {};
    if (sort === "price-low") sortOption = { price: 1 };
    else if (sort === "price-high") sortOption = { price: -1 };
    else if (sort === "rating") sortOption = { rating: -1 };

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    // بنجيب المنتجات وإجمالي العدد في نفس الوقت (أسرع من طلبين متتاليين)
    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, archivedAt: null });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// endpoint جديد: بيرجع أسماء الفئات الفريدة الموجودة فعلياً في الـ DB
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", { archivedAt: null });
    res.json(canonicalCategories(categories));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCategoriesWithImage = async (req, res) => {
  try {
    const categories = canonicalCategories(await Product.distinct("category", { archivedAt: null }));
    // بنجيب أول منتج من كل فئة عشان ناخد صورته
    const categoriesWithImage = await Promise.all(
      categories.map(async (category) => {
        const product = await Product.findOne({ category: categoryFilter(category), archivedAt: null, image: { $exists: true, $nin: ["", null] } });
        return { name: category, image: product?.image || "" };
      }),
    );
    res.json(categoriesWithImage);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, archivedAt: null });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const relatedProducts = await Product.find({
      category: categoryFilter(product.category),
      _id: { $ne: product._id }, // بنستبعد المنتج نفسه من النتيجة
      archivedAt: null,
    }).limit(4);

    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getProducts,
  getProductById,
  getCategories,
  getCategoriesWithImage,
  getRelatedProducts,
};
