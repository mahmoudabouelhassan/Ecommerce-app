import User from "../models/User.js";

export const getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const cartItems = user.cartItems.map((item) => ({
      id: item.productId?.toString(),
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      image: item.image,
      quantity: item.quantity,
      stock: item.stock,
    }));

    const wishlistItems = user.wishlistItems.map((item) => ({
      id: item.productId?.toString(),
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      badge: item.badge,
      badgeColor: item.badgeColor,
      image: item.image,
      images: item.images,
      category: item.category,
      rating: item.rating,
      stock: item.stock,
    }));

    res.json({ cartItems, wishlistItems });
  } catch (err) {
    console.error("getUserData function", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;

    const formattedCart = cartItems.map((item) => ({
      productId: item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      image: item.image,
      quantity: item.quantity,
      stock: item.stock,
    }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { cartItems: formattedCart },
      { returnDocument: "after", runValidators: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Cart updated" });
  } catch (err) {
    console.error("updateCart", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateWishlist = async (req, res) => {
  try {
    const { wishlistItems } = req.body;

    const formattedWishlist = wishlistItems.map((item) => ({
      productId: item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      badge: item.badge,
      badgeColor: item.badgeColor,
      image: item.image,
      images: item.images,
      category: item.category,
      rating: item.rating,
      stock: item.stock,
    }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { wishlistItems: formattedWishlist },
      { returnDocument: "after", runValidators: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Wishlist updated" });
  } catch (err) {
    console.error("updateWishlist", err);
    res.status(500).json({ message: "Server error" });
  }
};
