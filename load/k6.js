import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errors = new Rate("request_errors");
const latency = new Trend("http_latency", true);
const base = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const target = Number(__ENV.TARGET_VUS || 20);
const configuredStages = __ENV.RUN_SCALE_STAGES === "1";
const stages = configuredStages
  ? [{ duration: "2m", target: 1000 }, { duration: "3m", target: 10000 }, { duration: "3m", target: 50000 }, { duration: "3m", target: 100000 }, { duration: "3m", target: 200000 }, { duration: "1m", target: 0 }]
  : [{ duration: "20s", target: target }, { duration: "30s", target: target }, { duration: "10s", target: 0 }];

export const options = {
  stages,
  thresholds: {
    http_req_failed: ["rate<0.005"],
    http_req_duration: ["p(95)<800", "p(99)<2000"],
    request_errors: ["rate<0.005"],
  },
};

const routes = ["/", "/exams", "/jamb", "/waec", "/neco", "/bece", "/learn", "/practice", "/cbt", "/ai-tutor", "/mistake-bank", "/progress", "/planner", "/dashboard", "/news", "/admission", "/scholarships", "/signin", "/signup", "/api/health", "/api/ready"];
const optionalApiRoutes = (__ENV.API_ROUTES || "").split(",").map((part) => part.trim()).filter(Boolean);

function runScenario() {
  const path = [...routes, ...optionalApiRoutes][Math.floor(Math.random() * (routes.length + optionalApiRoutes.length))];
  const response = http.get(`${base}${path}`, { redirects: 3, tags: { route: path } });
  latency.add(response.timings.duration);
  const ok = check(response, { "response is not a server error": (r) => r.status < 500 });
  errors.add(!ok);
  sleep(1);
}

export default runScenario;
