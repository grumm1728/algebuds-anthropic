import type { NextConfig } from "next";
import { execSync } from "child_process";

let gitBranch = "unknown";
try {
  gitBranch = execSync("git branch --show-current", { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
} catch {}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GIT_BRANCH: gitBranch,
  },
};

export default nextConfig;
