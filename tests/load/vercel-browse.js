import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "https://ecommerce-mego.vercel.app";
const vus = Number(__ENV.VUS || 5);
const duration = __ENV.DURATION || "30s";

export const options = {
  scenarios: {
    browse: {
      executor: "constant-vus",
      vus,
      duration,
      gracefulStop: "5s",
    },
  },
  thresholds: {
    http_req_failed: [
      "rate<0.01",
      { threshold: "rate<0.05", abortOnFail: true, delayAbortEval: "15s" },
    ],
    "http_req_duration{endpoint:home}": ["p(95)<3000"],
    "http_req_duration{endpoint:home_products}": ["p(95)<3000"],
    "http_req_duration{endpoint:categories}": ["p(95)<3000"],
    "http_req_duration{endpoint:product_list}": ["p(95)<3000"],
  },
};

export default function () {
  const home = http.get(`${baseUrl}/`, {
    tags: { endpoint: "home" },
    timeout: "15s",
  });
  check(home, { "home returns 200": (response) => response.status === 200 });

  const responses = http.batch([
    ["GET", `${baseUrl}/api/products?page=2&limit=4`, null,
      { tags: { endpoint: "home_products" }, timeout: "15s" }],
    ["GET", `${baseUrl}/api/products/categories-with-image`, null,
      { tags: { endpoint: "categories" }, timeout: "15s" }],
  ]);
  check(responses[0], {
    "home products return 200": (response) => response.status === 200,
  });
  check(responses[1], {
    "categories return 200": (response) => response.status === 200,
  });

  const products = http.get(`${baseUrl}/api/products?page=1&limit=12`, {
    tags: { endpoint: "product_list" },
    timeout: "15s",
  });
  check(products, {
    "product list returns 200": (response) => response.status === 200,
  });

  sleep(2 + Math.random() * 2);
}
