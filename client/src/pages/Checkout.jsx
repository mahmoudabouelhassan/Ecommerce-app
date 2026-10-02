import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Banknote, CreditCard, LoaderCircle, PackageCheck, ShoppingBag } from "lucide-react";
import {
  useCreateCashOnDeliveryOrderMutation,
  useCreateCheckoutSessionMutation,
} from "../features/products/productsApiSlice";
import { clearCart } from "../features/cart/cartSlice";
import { getProductImage, useProductImageFallback } from "../utils/productImage";
import ProductPrice from "../components/ProductPrice";

const fields = [
  {
    name: "name",
    label: "Full Name",
    placeholder: "John Doe",
    type: "text",
    autocomplete: "name",
    rules: { required: "Name is required", minLength: { value: 2, message: "Enter at least 2 characters" } },
  },
  {
    name: "phone",
    label: "Phone Number",
    placeholder: "01xxxxxxxxx",
    type: "tel",
    autocomplete: "tel",
    rules: {
      required: "Phone number is required",
      pattern: { value: /^[0-9+\s-]{8,15}$/, message: "Enter a valid phone number" },
    },
  },
  {
    name: "email",
    label: "Email Address",
    placeholder: "john@example.com",
    type: "email",
    autocomplete: "email",
    rules: {
      required: "Email is required",
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
    },
  },
  {
    name: "address",
    label: "Address",
    placeholder: "Street, building and apartment",
    type: "text",
    autocomplete: "street-address",
    rules: { required: "Address is required", minLength: { value: 5, message: "Enter a more detailed address" } },
  },
  {
    name: "city",
    label: "City",
    placeholder: "Cairo",
    type: "text",
    autocomplete: "address-level2",
    rules: { required: "City is required", minLength: { value: 2, message: "Enter at least 2 characters" } },
  },
];

function CheckoutField({ field, register, error }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={field.name} className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {field.label}
      </label>
      <input
        id={field.name}
        type={field.type}
        autoComplete={field.autocomplete}
        placeholder={field.placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${field.name}-error` : undefined}
        {...register(field.name, field.rules)}
        className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        style={{
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          borderColor: error ? "#ef4444" : "var(--border-color)",
        }}
      />
      {error && <p id={`${field.name}-error`} role="alert" className="text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

function CheckoutLoader({ paymentMethod }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900 px-8 py-9 text-center text-white shadow-2xl">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
          <span className="absolute inset-1 animate-spin rounded-full border-4 border-blue-300/20 border-t-blue-400" />
          <PackageCheck className="relative text-blue-200" size={30} aria-hidden="true" />
        </div>
        <p className="text-xl font-bold">
          {paymentMethod === "cash_on_delivery" ? "Placing your order" : "Preparing secure payment"}
        </p>
        <p className="mt-2 text-sm text-slate-300">Please wait a moment. Keep this page open.</p>
      </div>
    </div>
  );
}

function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, totalQuantity } = useSelector((state) => state.cart);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [serverError, setServerError] = useState("");
  const [createCheckoutSession, { isLoading: isCardLoading }] = useCreateCheckoutSessionMutation();
  const [createCashOrder, { isLoading: isCashLoading }] = useCreateCashOnDeliveryOrderMutation();
  const isSubmitting = isCardLoading || isCashLoading;
  const { register, handleSubmit, formState: { errors } } = useForm({ mode: "onBlur" });

  const onSubmit = async (shippingInfo) => {
    setServerError("");
    const orderData = {
      items: items.map(({ id, quantity, price }) => ({ id, quantity, price })),
      shippingInfo,
    };

    try {
      if (paymentMethod === "cash_on_delivery") {
        const result = await createCashOrder(orderData).unwrap();
        dispatch(clearCart());
        navigate(`/order-placed/${result.orderId}`, { replace: true });
      } else {
        const result = await createCheckoutSession(orderData).unwrap();
        window.location.assign(result.url);
      }
    } catch (error) {
      setServerError(error.data?.message || "We couldn't place your order. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4" style={{ background: "var(--bg-primary)" }}>
        <ShoppingBag className="text-blue-500" size={44} aria-hidden="true" />
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Your cart is empty</h1>
        <Link to="/products" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10" style={{ background: "var(--bg-primary)" }}>
      {isSubmitting && <CheckoutLoader paymentMethod={paymentMethod} />}
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">Secure checkout</p>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Complete your order</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Choose how to pay after entering your delivery details.</p>
      </div>

      {serverError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-7 lg:col-span-2">
          <section className="rounded-2xl border p-6 shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <h2 className="mb-5 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Shipping information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.name === "address" ? "sm:col-span-2" : undefined}>
                  <CheckoutField field={field} register={register} error={errors[field.name]} />
                </div>
              ))}
            </div>
          </section>

          <fieldset className="rounded-2xl border p-6 shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <legend className="px-1 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Payment method</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { value: "card", title: "Pay by card", detail: "Secure checkout with Stripe", icon: CreditCard },
                { value: "cash_on_delivery", title: "Cash on delivery", detail: "Pay when your order arrives", icon: Banknote },
              ].map(({ value, title, detail, icon: Icon }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition hover:border-blue-400"
                  style={{ borderColor: paymentMethod === value ? "#2563eb" : "var(--border-color)", background: paymentMethod === value ? "rgba(37, 99, 235, 0.08)" : "var(--bg-card)" }}
                >
                  <input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="mt-1 accent-blue-600" />
                  <Icon size={22} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>
                    <span className="block text-sm" style={{ color: "var(--text-secondary)" }}>{detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="h-fit rounded-2xl border p-6 shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <h2 className="mb-5 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Order summary</h2>
          <div className="mb-5 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={getProductImage(item)} onError={useProductImageFallback} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Qty {item.quantity}</p>
                </div>
                <ProductPrice product={item} quantity={item.quantity} size="sm" showPercent={false} className="shrink-0 justify-end" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Total · {totalQuantity} items</span>
            <strong className="text-2xl text-blue-600">${totalPrice.toFixed(2)}</strong>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            Final prices and stock are verified before your order is placed.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : paymentMethod === "cash_on_delivery" ? <Banknote size={20} aria-hidden="true" /> : <CreditCard size={20} aria-hidden="true" />}
            {isSubmitting ? "Processing..." : paymentMethod === "cash_on_delivery" ? "Place cash order" : "Continue to secure payment"}
          </button>
          <Link to="/cart" className="mt-4 block text-center text-sm hover:text-blue-600" style={{ color: "var(--text-secondary)" }}>Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}

export default Checkout;
