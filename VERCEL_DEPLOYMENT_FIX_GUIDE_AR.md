# دليل إصلاح MyStore ونشره على Vercel

هذا الدليل يعيد تنفيذ **المشكلات الأربع التي أصلحناها في هذا المستودع**، بدءًا من الكود قبل الإصلاحات، وبالترتيب الذي يسمح بنشر الباك أولًا ثم الواجهة. المستودع واحد، لكن النشر هنا يتم في **مشروعي Vercel منفصلين**: `server` للـ Express API و`client` لواجهة React/Vite. لا يحتاج هذا المسار إلى دومين مدفوع.

> **لمن يطبّق الدليل على حساب آخر:** `https://ecommerce-server-five-cyan.vercel.app` و`https://ecommerce-mego.vercel.app` هما رابطا الإنتاج اللذان ظهرَا في تجربتنا. انسخ دومينات حسابك من صفحة **Domains** بدل افتراض أن هذه الأسماء ستكون متاحة لك. في الاسم الثاني حرف **g** في `mego`.

> **حدود النتيجة:** نجح اختبار المنتجات، فتح رابط واجهة مباشر، تمرير `/api`، وبقاء تسجيل الدخول بعد إعادة تحميل قسرية. هذا لا يثبت وحده أن إرسال البريد والدفع وStripe webhook قد اختُبرت؛ ستجد تنبيهات اختبارها في خطوات النشر ونهاية الدليل. وخطة Vercel Hobby مخصّصة للاستخدام الشخصي غير التجاري؛ إذا كان المتجر سيبيع فعليًا، راجع [سياسة Vercel للاستخدام التجاري](https://vercel.com/docs/limits/fair-use-guidelines).

## خريطة التنفيذ

| الترتيب | العمل | المعلومة التي تصبح متاحة |
| --- | --- | --- |
| 1 | إصلاح اتصال MongoDB في `server/server.js` | الباك جاهز للنشر |
| 2 | إنشاء `client/vercel.json` لإصلاح الروابط المباشرة | الواجهة جاهزة لاستقبال مسارات React |
| 3 | رفع إصلاحَي 1 و2 إلى GitHub، ثم نشر `server` | رابط الباك الثابت من **Domains** |
| 4 | تصحيح عنوان API في ملفّي RTK Query وإعداد Vite | الواجهة جاهزة لقيمة `VITE_API_URL` |
| 5 | إضافة تحويل `/api` إلى رابط الباك في `client/vercel.json` | حل مشكلة الكوكي دون تغيير `SameSite=Lax` |
| 6 | رفع تعديلات الواجهة إلى GitHub، ثم نشر `client` مع `VITE_API_URL=/api` | رابط الواجهة الثابت من **Domains** |
| 7 | ضبط `CLIENT_URL` في مشروع الباك وإعادة نشره | روابط استعادة كلمة المرور والدفع وCORS تشير للواجهة |
| 8 | اختبار المسارات وتسجيل الدخول بعد إعادة التحميل | تأكيد الإصلاحات الأربع |

قبل البدء، اعمل على نسخة من المستودع فيها مجلدا `server` و`client`. راجع أن فرع GitHub الذي ستستورد منه Vercel هو `main`، وأن الإصلاحات وصلت إليه قبل نشر كل مرحلة. ملفات `.env` المحلية مستبعدة من Git؛ **لا ترفع كلمات السر أو مفاتيح Stripe أو رابط MongoDB إلى المستودع**. [Vercel يربط نشر Production عادة بفرع `main`](https://vercel.com/docs/git).

## 1. مشكلة اتصال MongoDB قبل مسارات الـ API

### السبب والكود الموجود قبل الإصلاح

في النسخة الأصلية من [`server/server.js`](server/server.js) كان ترتيب التسجيل تقريبًا هكذا:

```js
app.post("/api/orders/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json());
app.use(cookieParser());
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/user", userRouter);

// هذا الجزء كان بعد المسارات؛ لذلك لا يسبق طلبات المسارات أعلاه.
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
};
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});
```

Express ينفّذ الـ middleware والمسارات بترتيب تسجيلها. فإذا عالج `/api/products` الطلب وأرسل الرد، فلن يصل الطلب إلى middleware الاتصال الذي جاء بعده. وفي Vercel لا ينفّذ الكود المحلي داخل `app.listen` عند `NODE_ENV=production`، لذلك لا يمكن الاعتماد عليه لفتح الاتصال. استعلامات Mongoose قبل الاتصال قد تبقى في قائمة انتظار ثم تفشل؛ كما أن المتغير `isConnected` وحده لا يشارك **محاولة الاتصال الجارية** بين طلبات متزامنة ولا يعكس انقطاع اتصال حدث لاحقًا. [توثيق Mongoose لانتظار الأوامر قبل الاتصال](https://mongoosejs.com/docs/connections.html).

### التعديل الجاهز للنسخ

افتح `server/server.js`. **بعد** نهاية `app.use(cors(...));` مباشرة، و**قبل** `app.post("/api/orders/webhook", ...)`، أضف هذا المقطع:

```js
// Reuse a live connection and share one in-progress connection attempt.
let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log("MongoDB Connected ..."))
      .finally(() => {
        connectionPromise = null;
      });
  }

  await connectionPromise;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});
```

بعد الإضافة، **احذف النسخة القديمة بالكامل** من `let isConnected = false;` إلى قوس إغلاق `app.use(async (req, res, next) => { ... });` الذي كان يأتي بعد `app.get("/", ...)`. لا تترك تعريفين لـ `connectDB` أو middleware مكررًا. يبقى ترتيب الجزء المهم هكذا:

```js
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
// هنا مقطع connectDB والـ middleware الجديد أعلاه.
app.post("/api/orders/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json());
app.use(cookieParser());
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/user", userRouter);
```

احتفظ بمسار Stripe webhook **قبل** `express.json()`؛ `express.raw()` يترك جسم الطلب خامًا حتى يستطيع Stripe التحقق من التوقيع. احتفظ كذلك بشرط التشغيل المحلي `if (process.env.NODE_ENV !== "production") { ... app.listen(...) }` وبـ `export default app` في نهاية الملف. Vercel يشغّل تطبيق Express المصدّر كـ Function. [توثيق Express على Vercel](https://vercel.com/docs/frameworks/backend/express).

**كيف يعمل المقطع الجديد؟** `readyState === 1` يعني وجود اتصال جاهز، فيُعاد استخدامه. `connectionPromise` تجعل الطلبات المتزامنة تنتظر محاولة اتصال واحدة. بعد نجاح المحاولة أو فشلها تُفرّغ القيمة في `finally`؛ فإذا انقطع الاتصال أو فشل، يمكن لمحاولة لاحقة أن تعيد الاتصال. الـ middleware ينتظر الاتصال **قبل** الوصول إلى أي route، بما فيه webhook، ويرسل 500 واضحًا إذا فشل.

في هذه النسخة، [`server/vercel.json`](server/vercel.json) **موجود أصلًا** ومحتواه التالي؛ لا تنشئ ملفًا ثانيًا في جذر المستودع لمشروع الباك:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

هو يوجّه طلبات مشروع `server` إلى تطبيق Express في `server.js`. إعداد `builds` قديم لكنه ما زال مدعومًا؛ هذا الدليل يصف الإعداد الذي نجح في المشروع، وليس ترحيلًا منفصلًا إلى صيغة Vercel أحدث. [مرجع `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json).

## 2. مشكلة 404 عند فتح رابط واجهة مباشر

### السبب والكود الموجود

[`client/src/main.jsx`](client/src/main.jsx) يستخدم `BrowserRouter`. عند الانتقال داخل التطبيق إلى `/products` يتولى React عرض الصفحة، لكن عند فتح `https://FRONTEND_DOMAIN/products` مباشرة يطلب المتصفح هذا المسار من Vercel. قبل الإصلاح لم يكن ملف `client/vercel.json` موجودًا لإعادة هذا الطلب إلى `index.html`، فظهرت 404. [توثيق Vercel لتطبيقات Vite SPA](https://vercel.com/docs/frameworks/frontend/vite).

### التعديل الجاهز للنسخ

أنشئ **ملفًا جديدًا** اسمه `client/vercel.json` بالمحتوى الأولي التالي:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

`source` يطابق المسارات التي يزورها المتصفح؛ `destination` يجعل Vercel يقدّم `index.html` لتقرأ React العنوان وتعرض الصفحة الصحيحة. `$schema` يساعد المحرر على فحص صيغة الملف. **هذا محتوى مرحلي**؛ سنضيف قبله قاعدة `/api` بعد معرفة رابط الباك. لا تنشر الواجهة الآن.

احفظ **إصلاحَي الخطوتين 1 و2** في Git، وارفع فرع الإصلاحات وادمجه في `main` قبل استيراد الباك. في تجربتنا كان اسم الفرع `mahmoud-updates`. إذا لم يكن موجودًا عندك، أنشئه أولًا بـ `git switch -c mahmoud-updates`. ثم من جذر المستودع:

```bash
git add server/server.js client/vercel.json
git commit -m "fix: prepare backend and SPA routing for Vercel"
git push -u origin mahmoud-updates
```

افتح Pull Request من `mahmoud-updates` إلى `main` وادمجه. إذا كانت التعديلات محفوظة بالفعل في commit، انتقل إلى الخطوة التالية دون إنشاء commit مكرر. سيقرأ Vercel ملفات `main` على GitHub، وليس الملفات المحلية غير المرفوعة.

## 3. انشر الباك الآن، وخذ رابط الإنتاج من Vercel

1. في Vercel اختر **Add New → Project**، ثم استورد مستودع GitHub. إذا أظهر Vercel `Services` مع `client` و`server`، اضغط **Import single project** في صف **`server` / Express**؛ في هذا السيناريو ننشئ مشروعين منفصلين من المستودع نفسه. [توثيق Vercel للمستودعات متعددة التطبيقات](https://vercel.com/docs/monorepos).
2. راجع **Root Directory = `server`** و**Application Preset = Express**. سمِّ المشروع مثلًا `ecommerce-server`. لا تضع Root Directory = `./` لهذا المشروع.
3. في **Environment Variables** أضف القيم الفعلية التي يحتاجها الباك كما في الجدول. اختر **Production** على الأقل. استخدم قيمًا سرية حقيقية من حسابات صاحب المشروع، ولا تنسخ القيم إلى هذا الدليل أو GitHub.

   | المفتاح | القيمة في Vercel | التوقيت |
   | --- | --- | --- |
   | `MONGODB_URI` | سلسلة اتصال MongoDB Atlas الكاملة | قبل أول نشر |
   | `JWT_SECRET` | سر طويل لتوقيع جلسات الدخول | قبل أول نشر |
   | `RESEND_API_KEY` | مفتاح Resend إذا ستستخدم استعادة كلمة المرور | قبل اختبار البريد |
   | `STRIPE_SECRET_KEY` | مفتاح Stripe السري، ويفضّل Test mode أثناء التجربة | قبل اختبار الدفع |
   | `STRIPE_WEBHOOK_SECRET` | سر webhook الخاص **بالعنوان المنشور**، لا سر Stripe CLI المحلي | بعد إنشاء endpoint؛ يمكن تأجيله |
   | `CLIENT_URL` | **يُترك الآن** إلى أن يظهر دومين الواجهة؛ امسح أي عنوان محلي قديم إن ظهر | في الخطوة 7 |

   لا تضف `PORT`؛ يستخدمه `app.listen` محليًا فقط. افحص **Node.js Version** في إعدادات بناء المشروع إذا حدث فشل بسبب إصدار Node: حزمة Mongoose 9 في هذا المشروع تتطلب Node 20.19 أو أحدث، وتوثيق Vercel الحالي يعرض 24.x كإصدار افتراضي للمشاريع الجديدة. [Mongoose 9](https://mongoosejs.com/docs/migrating_to_9.html)، [إصدارات Node على Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
4. اضغط **Deploy** أو **Create Project** حسب واجهة Vercel. إذا أُنشئ المشروع وظهرت عبارة **No Production Deployment**، افتح **Deployments**، أزل أي فلتر مثل `Status: Error`، ثم اختر **Create Deployment**، وحدد فرع `main` واضغط **Deploy to Production**. إذا ظهرت حالة `Error` افتح **Build Logs** لذلك النشر. [Vercel يتيح إنشاء نشر من فرع Git عبر Dashboard](https://vercel.com/docs/git).
5. عند حالة **Ready**، افتح صفحة **Domains** في مشروع الباك. انسخ الدومين المحدد **Production** مع إضافة `https://` أمامه. لا تستخدم عنوان **Deployment** الذي يحوي حروفًا عشوائية ويتعلق بنشر واحد. في تجربتنا أصبح: `https://ecommerce-server-five-cyan.vercel.app`. [شرح دومينات النشر](https://vercel.com/docs/deployments/generated-urls).
6. جرّب `https://BACKEND_DOMAIN/api/products`. ظهور JSON يحوي `products` يؤكد أن مسار API واتصال MongoDB يعملان لهذا الطلب. إن فشل، افتح **Logs** في مشروع الباك وتحقق من `MONGODB_URI` وإعدادات وصول قاعدة البيانات.

**للدفع فقط، بعد ظهور رابط الباك:** سجّل webhook في لوحة Stripe بعنوان `https://BACKEND_DOMAIN/api/orders/webhook`، واختر حدث `checkout.session.completed` الذي يعالجه الكود. انسخ signing secret الخاص بهذا الـ endpoint إلى `STRIPE_WEBHOOK_SECRET` في Vercel ثم أعد نشر الباك. اجعل وضع Test/Live متوافقًا مع `STRIPE_SECRET_KEY`. لا تختبر نجاح الطلبات بالعودة إلى صفحة `order-success` وحدها؛ تأكد من استقبال webhook وتحديث الطلب. [توثيق Stripe للـ webhook endpoints](https://docs.stripe.com/api/webhook_endpoints).

## 4. مشكلة عنوان الـ API في الواجهة: تجهيز الكود بعد نشر الباك

### السبب والكود الموجود قبل الإصلاح

في كلا الملفين [`client/src/features/auth/authApiSlice.js`](client/src/features/auth/authApiSlice.js) و[`client/src/features/products/productsApiSlice.js`](client/src/features/products/productsApiSlice.js) كان `fetchBaseQuery` يستخدم:

```js
baseUrl: import.meta.url
  ? import.meta.env.VITE_API_URL
  : "http://localhost:5000/api",
credentials: "include",
```

`import.meta.url` هو عنوان ملف JavaScript نفسه، وقيمته موجودة في التطوير والبناء؛ لذلك الشرط يختار `VITE_API_URL` دائمًا. لو لم تُضبط القيمة وقت بناء Vite فقد يصبح `baseUrl` غير صالح. وملف `.env` المحلي غير مرفوع إلى GitHub. كذلك فإن وضع `http://localhost:5000/api` كمتغير في Vercel يجعل متصفح الزائر يحاول الاتصال **بجهاز الزائر**. متغيرات `VITE_` تُضمَّن في الواجهة وقت البناء، لا وقت زيارة الصفحة. [توثيق Vite للمتغيرات](https://vite.dev/guide/env-and-mode).

وكان [`client/vite.config.js`](client/vite.config.js) قبل الإصلاح يعرّف الإضافات فقط؛ لا يتحقق من وجود عنوان API عند البناء:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### التعديل الجاهز للنسخ

في **الملفين معًا** استبدل الأسطر السابقة بهذه الأسطر فقط، واترك بقية `createApi` و`endpoints` كما هي:

```js
baseUrl: import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : undefined),
credentials: "include",
```

في [`client/vite.config.js`](client/vite.config.js)، **استبدل محتوى الملف كاملًا** بهذا المحتوى:

```js
import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL;

  if (command === "build" && !apiUrl?.trim()) {
    throw new Error(
      "VITE_API_URL is required for builds. Set it to /api in the Vercel frontend project.",
    );
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
```

وأنشئ [`client/.env.example`](client/.env.example) بالمحتوى التالي:

```dotenv
# Local development. In the Vercel frontend project, set VITE_API_URL to /api.
VITE_API_URL=http://localhost:5000/api
```

`import.meta.env.DEV` يجعل العنوان المحلي fallback للتطوير فقط. في الإنتاج لا نعتمد على fallback: `vite.config.js` يفشل البناء برسالة واضحة إذا كانت `VITE_API_URL` فارغة. `loadEnv` يقرأ المتغير أثناء البناء. `credentials: "include"` كان موجودًا أصلًا ويُبقي إرسال الكوكي مع الطلبات؛ لا يحل وحده مشكلة طلبات نطاقين مختلفين. `.env.example` مثال للتطوير المحلي، **وليست قيمته ما سنضعه في Vercel**؛ قيمة Vercel ستكون `/api` في الخطوة 6. كل قيمة تبدأ بـ `VITE_` تظهر في ملفات الواجهة المبنية، فلا تضع فيها سرًا.

هذه التعديلات تخص الواجهة، لذا يأتي رفعها مع تحويل `/api` في الخطوة 5 قبل نشر الواجهة، بعد أن أصبح دومين الباك معلومًا.

## 5. مشكلة الكوكي بين دومينَي Vercel: أضف تحويل `/api` بعد معرفة رابط الباك

### السبب والكود الموجود قبل الحل

[`server/src/controllers/authController.js`](server/src/controllers/authController.js) ينشئ كوكي الدخول أصلًا هكذا:

```js
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

`HttpOnly` يمنع JavaScript في الصفحة من قراءة قيمة التوكن؛ `Secure` يجعلها عبر HTTPS في الإنتاج؛ `SameSite=Lax` يسمح بإرسالها داخل الموقع نفسه ويقلل إرسالها عبر طلبات المواقع الأخرى. عند نشر الواجهة والباك على اسمين مختلفين تحت `vercel.app`، يكون `fetch` المباشر من الواجهة إلى الباك طلبًا **cross-site**، ولا ترسل المتصفحات هذه الكوكي مع `fetch` لمجرد وجود `credentials: "include"`. ولا يمكن جعل `Domain=vercel.app` حلًا لأن `vercel.app` public suffix. [MDN: SameSite وDomain](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)، [Vercel: public suffix](https://vercel.com/kb/guide/can-i-set-a-cookie-from-my-vercel-project-subdomain-to-vercel-app).

كما أن `client/vercel.json` من الخطوة 2 يحتوي قاعدة عامة تحوّل كل المسارات إلى `index.html`. لو بقي وحده، سيصل طلب `/api/products` إلى HTML الواجهة بدل الباك. **تعديل `CLIENT_URL` أو CORS وحده لا يغيّر قواعد `SameSite` في المتصفح.**

### التعديل الجاهز للنسخ

**استبدل محتوى `client/vercel.json` الأولي كاملًا** بالمحتوى النهائي التالي. هذا هو كود تجربتنا الفعلي، جاهز للنسخ لهذا المستودع؛ إذا كان الباك في حساب آخر، استبدل **الدومين فقط** بما نسخته من **Domains** في الخطوة 3:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ecommerce-server-five-cyan.vercel.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

القاعدة الأولى تستقبل مثلًا `/api/products` على **دومين الواجهة**، وتنقله داخليًا إلى `/api/products` على دومين الباك مع بقاء عنوان المتصفح على الواجهة. `:path*` يمرر بقية المسار، وترتيب القاعدة **قبل** `/(.*)` ضروري حتى لا يستقبل `index.html` طلبات API. القاعدة الثانية تبقى لحل الروابط المباشرة. [توثيق Vercel للتحويلات إلى مصدر خارجي](https://vercel.com/docs/routing/rewrites).

لا تستبدل `sameSite: "lax"` بـ `none` في هذا السيناريو، ولا تضف `Domain` للكوكي. الـ API يبدو للمتصفح جزءًا من دومين الواجهة، والكوكي الناتجة عن الرد تصبح خاصة به. ستبقى `credentials: "include"` في ملفّي RTK Query كما هي. هذا هو حل المشكلة الرابعة، ويكمل المشكلة الثالثة عندما نضع `VITE_API_URL=/api` في مشروع الواجهة.

احفظ **تغييرات الخطوتين 4 و5 معًا** في Git وادمجها في `main` **قبل نشر الواجهة**. إذا كان `mahmoud-updates` قد دُمج من قبل، يمكنك إضافة commit جديد إليه وفتح Pull Request جديد إلى `main`:

```bash
git add client/src/features/auth/authApiSlice.js client/src/features/products/productsApiSlice.js client/vite.config.js client/.env.example client/vercel.json
git commit -m "fix: configure frontend API and same-origin proxy"
git push origin mahmoud-updates
```

## 6. انشر الواجهة، وخذ رابطها من Vercel

1. في Vercel اختر **Add New → Project** واستورد **المستودع نفسه مرة ثانية**. اختر **Import single project** في صف **`client` / Vite**. راجع **Root Directory = `client`** و**Application Preset = Vite**. سمِّ المشروع مثلًا `ecommerce-app`. [خطوات monorepo الرسمية](https://vercel.com/docs/monorepos).
2. افتح **Environment Variables** قبل الضغط على Deploy، وأضف مفتاحًا واحدًا للواجهة: `VITE_API_URL` وقيمته **`/api` فقط**. إذا ظهرت في خانة Vercel القيمة `http://localhost:5000/api`، امسحها واكتب `/api`. لا تضع رابط الباك المباشر هنا ولا علامات تنصيص. هذه القيمة تدخل في حزمة Vite وقت البناء؛ تغييرها لاحقًا يتطلب نشرًا جديدًا. [Vite](https://vite.dev/guide/env-and-mode)، [Vercel Environment Variables](https://vercel.com/docs/environment-variables).
3. اضغط **Deploy** وانتظر حالة **Ready**. فشل البناء برسالة `VITE_API_URL is required for builds` يعني أن المتغير لم يُضبط لبيئة هذا النشر. وإن لم يظهر Production Deployment فاستعمل **Deployments → Create Deployment → main → Deploy to Production** مثل الباك.
4. افتح مشروع الواجهة → **Domains**، وانسخ الدومين الذي عليه **Production / Valid Configuration**، وأضف `https://`. قد يكون الاسم الافتراضي عشوائيًا؛ يمكنك اختيار اسم متاح آخر من إعدادات الدومينات قبل الخطوة 7. في تجربتنا انتهى الاسم إلى `https://ecommerce-mego.vercel.app`، ولم نستخدم الاسم الافتراضي الأول `ecommerce-app-liard-two.vercel.app` في `CLIENT_URL`.
5. افتح `https://FRONTEND_DOMAIN/api/products`: يجب أن يظهر **JSON** من الباك، لا HTML الواجهة. افتح `https://FRONTEND_DOMAIN/products` مباشرة أو حدّثها: يجب أن تُعرض واجهة React بدل صفحة 404 من Vercel.

## 7. اضبط عنوان الواجهة في الباك ثم أعد نشره

في مشروع **`ecommerce-server`** على Vercel افتح **Environment Variables**. أضف أو حرر المفتاح `CLIENT_URL` لبيئة **Production** بالقيمة الكاملة التالية في حالتنا:

```dotenv
CLIENT_URL=https://ecommerce-mego.vercel.app
```

ضع **`https://`**، ولا تضف `/api` أو `/` في النهاية. `server/server.js` يقرأه في إعداد CORS، و`authController.js` يستعمله في رابط إعادة تعيين كلمة المرور، و`orderController.js` يستعمله في `success_url` و`cancel_url` الخاصين بـ Stripe. كتابته `ecommerce-mego.vercel.app` بلا بروتوكول ينتج روابط غير مكتملة و`Access-Control-Allow-Origin` غير صحيح.

بعد **Save** افتح **Deployments** في مشروع الباك، واضغط القائمة `⋯` على أحدث نشر Production ثم **Redeploy**، أو أنشئ نشرًا جديدًا من `main`. تغيير متغيرات Vercel لا يغيّر النسخ المنشورة بالفعل؛ يحتاج نشرًا جديدًا. [توثيق Vercel](https://vercel.com/docs/environment-variables). بعد نجاحه يمكن فحص استجابة `/api/products`: يجب أن تكون قيمة `Access-Control-Allow-Origin` هي `https://ecommerce-mego.vercel.app` كاملة.

إذا غيرت دومين الواجهة لاحقًا، غيّر `CLIENT_URL` وأعد نشر الباك. وإذا تغير دومين الباك، غيّر `destination` في `client/vercel.json` وارفع التعديل وأعد نشر الواجهة. انتبه إلى أن الكوكي خاصة بالدومين الذي استُخدم وقت تسجيل الدخول؛ تغيير دومين الواجهة قد يتطلب تسجيل الدخول مجددًا.

## 8. اختبار كل مشكلة بعد النشر

| الاختبار | النتيجة المتوقعة | ماذا يثبت؟ |
| --- | --- | --- |
| افتح `https://BACKEND_DOMAIN/api/products` | حالة 200 وJSON يحتوي `products` | الباك ومسار المنتجات واتصال MongoDB |
| افتح `https://FRONTEND_DOMAIN/products` مباشرة أو بعد `Ctrl+Shift+R` | الصفحة تعرض React بدل 404 | rewrite الخاص بالـ SPA |
| افتح `https://FRONTEND_DOMAIN/api/products` | حالة 200 وJSON، وليس `index.html` | قيمة `/api` وترتيب proxy rewrite |
| سجّل الدخول من دومين الواجهة | تظهر كوكي `token` على دومين الواجهة وبها `HttpOnly` و`Secure` و`SameSite=Lax` | رد تسجيل الدخول مرّ عبر نفس الدومين |
| حدّث الصفحة ثم نفّذ `Ctrl+Shift+R` | يظل الحساب مسجّلًا، و`GET /api/auth/me` يرجع 200 | إرسال الكوكي للباك والتحقق منها بعد تحميل جديد |

الاختبار الأخير قوي في هذا المشروع تحديدًا: [`client/src/hooks/useAuthCheck.js`](client/src/hooks/useAuthCheck.js) يطلب `auth/me` عند تحميل التطبيق، و[`client/src/app/store.js`](client/src/app/store.js) يحفظ `cart` و`wishlist` فقط في `localStorage`، ولا يحفظ حالة `auth`. لذا بقاء تسجيل الدخول بعد تحميل قسري يعني أن الخادم تحقّق من كوكي الجلسة، لا مجرد بقاء حالة واجهة مخزنة.

إذا فشل اختبار معيّن، ابدأ من الخطوة المرتبطة به: **Logs/Build Logs** للباك عند خطأ قاعدة البيانات، **Root Directory** و`client/vercel.json` عند 404، قيمة `VITE_API_URL` عند طلبات خاطئة، و**Domains** و`CLIENT_URL` وأحدث Redeploy عند مشكلة تسجيل الدخول أو روابط البريد والدفع. اختبر البريد وStripe webhook بشكل مستقل قبل اعتبار **كل وظائف المتجر** جاهزة.

## مراجع التوثيق

- [Vercel: نشر مجلدين من مستودع واحد](https://vercel.com/docs/monorepos)
- [Vercel: Express على Functions](https://vercel.com/docs/frameworks/backend/express)
- [Vercel: Vite SPA وروابطها المباشرة](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel: Rewrites وproxy خارجي](https://vercel.com/docs/routing/rewrites)
- [Vercel: Git وفرع Production](https://vercel.com/docs/git)
- [Vercel: متغيرات البيئة وإعادة النشر](https://vercel.com/docs/environment-variables)
- [Vite: متغيرات `import.meta.env`](https://vite.dev/guide/env-and-mode)
- [Mongoose: الاتصال وانتظار الاستعلامات](https://mongoosejs.com/docs/connections.html)
- [MDN: خصائص الكوكي و`SameSite`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
