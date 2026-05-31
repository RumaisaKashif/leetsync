# LeetSync

[![Deploy Frontend](https://github.com/RumaisaKashif/leetsync/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/RumaisaKashif/leetsync/actions/workflows/deploy-frontend.yml)
[![Deploy Scraper](https://github.com/RumaisaKashif/leetsync/actions/workflows/deploy-scraper.yml/badge.svg)](https://github.com/RumaisaKashif/leetsync/actions/workflows/deploy-scraper.yml)

Automatically syncs every accepted LeetCode submission to a GitHub repository, organised by topic. Runs on a schedule via AWS Lambda — no manual effort after setup.

**[Live demo →](https://leetsync-web-omega.vercel.app/)** · **[Solutions repo →](https://github.com/RumaisaKashif/leetcode-solutions)**

---

## What it does

1. Hits LeetCode's internal GraphQL API with your session cookies
2. Pulls all accepted submissions, deduplicates by problem, fetches code + stats + your personal notes
3. Pushes three files per problem to a GitHub repo organised into topic folders:

   | File | Contents |
   |---|---|
   | `solution.py` | The raw accepted code exactly as submitted on LeetCode |
   | `notes.md` | Your personal notes written on LeetCode for that problem (if any) |
   | `details.md` | Auto-generated stats: difficulty, topic tags, language, runtime percentile, memory percentile |

4. Repeats every 3 days via AWS EventBridge

The frontend reads directly from that GitHub repo and renders everything as a portfolio page.

---

## Architecture

```
LeetCode API
     │  (GraphQL, cookie auth)
     ▼
scraper/main.py ──► github/pusher.py ──► leetcode-solutions repo
     │                                        │
  AWS Lambda                            GitHub Contents API
  (container)                                 │
  triggered by                                ▼
  EventBridge                          React frontend
  every 3 days                         (Vercel, reads via GitHub API)
```

CI/CD via GitHub Actions:
- Push to `scraper/` → rebuilds Docker image → pushes to ECR → updates Lambda
- Push to `frontend/` → builds React app → deploys to Vercel

---

## Stack

| Layer | Tech |
|---|---|
| Scraper | Python, `requests`, LeetCode GraphQL API |
| Storage | GitHub repository (via Contents API) |
| Scheduling | AWS EventBridge (cron every 3 days) |
| Runtime | AWS Lambda (container image) |
| Container registry | AWS ECR |
| Frontend | React 18, Framer Motion, Tailwind CSS |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

---

## Set up your own

### Prerequisites

- LeetCode account with submitted solutions
- GitHub account
- AWS account (free tier is fine)
- Node.js 18+, Python 3.12+, Docker

---

### Step 1 — Create your solutions repo

Create a new empty GitHub repo (e.g. `leetcode-solutions`). This is where your code will live — separate from this repo.

---

### Step 2 — Get your LeetCode session cookies

1. Log into [leetcode.com](https://leetcode.com) in Chrome
2. Open DevTools → Application → Cookies → `https://leetcode.com`
3. Copy the values for `LEETCODE_SESSION` and `csrftoken`

These expire periodically — you'll need to refresh them every few weeks.

---

### Step 3 — Create a GitHub personal access token

Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic):
- Scopes: `repo` (full control of private repositories)

You'll need two tokens:
- One with `repo` scope for the scraper (writes to your solutions repo)
- One with no scopes for the frontend (read-only, public repos only)

---

### Step 4 — Configure environment variables

Create a `.env` file in the project root (never commit this):

```env
LEETCODE_SESSION=your_leetcode_session_cookie
CSRF_TOKEN=your_csrftoken_cookie
GITHUB_TOKEN=your_github_pat_with_repo_scope
GITHUB_USERNAME=your_github_username
GITHUB_REPO=leetcode-solutions
```

---

### Step 5 — Test the scraper locally

```bash
pip install -r requirements.txt
python scraper/main.py
```

Check your solutions repo — you should see folders like `arrays/`, `trees/`, `dynamic-programming/` appearing.

---

### Step 6 — Build and push to AWS ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name leetsync --region your-region

# Authenticate Docker with ECR
aws ecr get-login-password --region your-region | \
  docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com

# Build and push (linux/amd64 required for Lambda)
docker build --platform linux/amd64 --provenance=false -t leetsync .
docker tag leetsync:latest your-account-id.dkr.ecr.your-region.amazonaws.com/leetsync:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/leetsync:latest
```

---

### Step 7 — Create the Lambda function

```bash
aws lambda create-function \
  --function-name leetsync \
  --package-type Image \
  --code ImageUri=your-account-id.dkr.ecr.your-region.amazonaws.com/leetsync:latest \
  --role arn:aws:iam::your-account-id:role/lambda-execution-role \
  --timeout 300 \
  --memory-size 512
```

Add your `.env` values as Lambda environment variables:
AWS Console → Lambda → your function → Configuration → Environment variables.

---

### Step 8 — Schedule with EventBridge

```bash
aws events put-rule \
  --name leetsync-schedule \
  --schedule-expression "rate(3 days)"

aws events put-targets \
  --rule leetsync-schedule \
  --targets "Id=leetsync,Arn=arn:aws:lambda:your-region:your-account-id:function:leetsync"
```

---

### Step 9 — Deploy the frontend

Update `GITHUB_USER` and `GITHUB_REPO` at the top of `frontend/src/App.js` to point to your solutions repo.

```bash
cd frontend
npm install
npx vercel   # follow prompts to create project
```

---

### Step 10 — Set up CI/CD

Fork this repo, then add these secrets under Settings → Secrets and variables → Actions:

| Secret | Description |
|---|---|
| `REACT_APP_GITHUB_TOKEN` | GitHub token (no scopes, for frontend rate limit) |
| `VERCEL_TOKEN` | From vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `frontend/.vercel/project.json` after `vercel` init |
| `VERCEL_PROJECT_ID` | From `frontend/.vercel/project.json` after `vercel` init |
| `AWS_ACCESS_KEY_ID` | IAM user key (needs ECR + Lambda permissions) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AWS_REGION` | Region your Lambda and ECR live in |
| `ECR_REPOSITORY` | ECR repository name (e.g. `leetsync`) |
| `LAMBDA_FUNCTION_NAME` | Lambda function name (e.g. `leetsync`) |

From here, pushing to `main` automatically deploys everything.

---

### Regenerate the README in your solutions repo

If you want a nicely formatted index of all your problems:

```bash
python scraper/generate_readme.py
```

---

## Project structure

```
leetsync/
├── scraper/
│   ├── main.py              # Lambda handler — fetches and pushes all solutions
│   └── generate_readme.py   # One-off script to build the solutions repo README
├── github/
│   └── pusher.py            # GitHub Contents API wrapper
├── frontend/
│   └── src/App.js           # React frontend
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml   # Vercel deploy on frontend changes
│       └── deploy-scraper.yml    # ECR + Lambda deploy on scraper changes
├── Dockerfile
└── requirements.txt
```

---

## Notes

- LeetCode session cookies expire — if the Lambda stops syncing, refresh your cookies and update the Lambda environment variables
- GitHub API rate limit is 60 req/hr unauthenticated. Set `REACT_APP_GITHUB_TOKEN` (no scopes needed) to raise it to 5,000
- The scraper deduplicates by `titleSlug` — only the most recent accepted submission per problem is pushed
