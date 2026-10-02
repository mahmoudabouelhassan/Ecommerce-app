# Vercel browse load test

The test targets `https://ecommerce-mego.vercel.app` and simulates each virtual user opening the home page, loading its featured products and categories, then opening the product list. It only sends GET requests. It does not run browser JavaScript, download product images, sign in, or check out.

Grafana k6 v2.3.0 is installed locally at `.tools/k6-v2.3.0-windows-amd64/k6.exe` (the `.tools` directory is ignored by Git). From the repository root, run:

```powershell
& '.tools/k6-v2.3.0-windows-amd64/k6.exe' run -e VUS=20 -e DURATION=30s --summary-export='tests/load/results/vus-20.json' 'tests/load/vercel-browse.js'
```

The run stops if the overall request error rate exceeds 5% after 15 seconds. The pass criteria are fewer than 1% failed requests and a p95 below 3 seconds for each tested endpoint. The raw summary files are in `tests/load/results/` and are ignored by Git.

## Results, 2026-10-02

| Virtual users | Requests | Failed requests | Overall p95 | Categories p95 |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 16 | 0% | 2.54 s | not recorded |
| 5 | 124 | 0% | 3.76 s | not recorded |
| 10 | 252 | 0% | 3.48 s | 4.72 s |
| 20 | 520 | 0% | 2.18 s | 5.39 s |
| 40 | 944 | 0.21% | 3.26 s | 6.62 s |
| 80 | 256 | 27.73% | 15 s | 15 s |

The 80-user run stopped after about 16 seconds due to timeouts. Each of the other runs lasted 30 seconds, except the 1-user smoke run (20 seconds). The test demonstrates that 20 simultaneous browsing users completed without errors during the short run, while 80 exceeded capacity for this scenario. It does not establish a sustained production capacity. At 10 users and above, the categories endpoint already missed the 3-second p95 criterion. The site returned HTTP 200 on all tested endpoints after the run.
