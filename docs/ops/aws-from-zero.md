# From zero AWS to a live Coupon Hub (laptop)

Follow **in order**. Do not skip. You do **not** create ECR/RDS/ALB by hand and you do **not** set up GitHub OIDC.

**Region:** `us-east-1`  
**Public URL (first time):** `https://xxxxx.cloudfront.net` (no custom domain yet)  
**Cost after this works:** roughly **$35–55/month** plus a little CloudFront traffic.

Repo root on this Mac:

```text
/Users/ashishmishra/Documents/affiliate
```

---

## Phase A — AWS account (browser, ~20 minutes)

### A1. Create the account

1. Open [https://portal.aws.amazon.com/billing/signup](https://portal.aws.amazon.com/billing/signup).
2. Use a real email and a **strong** password.
3. Add a credit card (required).
4. Choose **Personal** (or Business if you have a company).
5. Confirm the phone/SMS check.

You are now the **root** user. Do not use root for deploys.

### A2. Lock root and stop surprise bills

1. Sign in as root → click the account name (top right) → **Security credentials**.
2. Enable **MFA** on the root user (phone or hardware key).
3. Search the console for **Billing** → **Budgets** → **Create budget**.
   - Template: **Monthly cost budget**
   - Amount: **80** USD (or whatever you can afford)
   - Email: yours
4. Search **Billing preferences** → turn on **Receive Free Tier Usage Alerts** if shown.

### A3. Create a user for *this laptop* (not root)

Fast path (solo, first deploy):

1. Search **IAM** → **Users** → **Create user**.
2. Name: `coupon-hub-admin`.
3. Check **Provide user access to the AWS Management Console** if you want console login; also you need **CLI**.
4. On permissions: **Attach policies directly** → tick **AdministratorAccess**.  
   (You can tighten this later. First apply needs VPC, RDS, ECS, IAM, CloudFront.)
5. Create the user.
6. Open the user → **Security credentials** → **Create access key** → use case **Command Line Interface (CLI)** → confirm → **Create**.
7. Download the `.csv` or copy **Access key ID** and **Secret access key** into a password manager.  
   You will **not** see the secret again.  
   **Never** paste these into git, Slack, or `.env` that gets committed.

(Optional later: replace this with IAM Identity Center / SSO. Not required to go live.)

---

## Phase B — This Mac (tools + login)

Open **Terminal**. Install tools if you don’t have them:

```bash
brew install awscli
# Homebrew has no formula named "terraform" anymore — use HashiCorp's tap:
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

Docker must work. If `docker info` fails:

```bash
colima start
docker info
```

You should see `Server:` without an error.

Configure the CLI **once**:

```bash
aws configure --profile coupon-hub
```

When prompted:

| Prompt | Type |
|--------|------|
| AWS Access Key ID | from the IAM csv |
| AWS Secret Access Key | from the IAM csv |
| Default region name | `us-east-1` |
| Default output format | `json` |

Check:

```bash
aws sts get-caller-identity --profile coupon-hub
```

You must see your **Account** number and `coupon-hub-admin`. If this fails, stop — nothing else will work.

RDS is **private** (`publicly_accessible = false`). Prisma on this Mac cannot reach it. Schema changes run as a one-off Fargate task in the VPC — do not open the database to the internet.

---

## Phase C — Tell Terraform who you are

```bash
cd /Users/ashishmishra/Documents/affiliate
cp infra/terraform/staging.tfvars.example infra/terraform/terraform.tfvars
```

Edit `infra/terraform/terraform.tfvars` in any editor. It should look like this:

```hcl
project      = "coupon-hub"
environment  = "staging"
aws_region   = "us-east-1"
aws_profile  = "coupon-hub"

enable_web_service   = false
container_image_tag  = "staging"
desired_count        = 1
task_cpu             = "256"
task_memory          = "512"
db_instance_class    = "db.t4g.micro"

# Leave empty. Laptop Prisma cannot reach private RDS even with a CIDR hole.
# operator_cidr = ""
```

Leave `enable_web_service = false` for the first apply.

---

## Phase D — Create the cloud (first apply)

This creates VPC, ECR, RDS, secrets, ALB, CloudFront. **No website containers yet** (no image to run).

```bash
cd /Users/ashishmishra/Documents/affiliate
bash scripts/aws/infra-up.sh
```

Terraform will print a plan. Type `yes` when it asks to apply.

**Wait 10–20 minutes.** RDS and CloudFront are slow the first time.

If it errors on credentials, re-run `aws sts get-caller-identity --profile coupon-hub`.

When it finishes you should see something like:

```text
CloudFront: https://d111111abcdef8.cloudfront.net
ECR:        123456789012.dkr.ecr.us-east-1.amazonaws.com/coupon-hub
Wrote .../.env.aws.generated
```

Copy generated config into the file the deploy scripts use:

```bash
cp .env.aws.generated .env.aws
```

Open `.env.aws` and confirm it has `ECR_REPOSITORY=...` and `AWS_PROFILE=coupon-hub`.  
If `STAGING_URL` is empty, set it to the CloudFront URL printed above.

---

## Phase E — Build the app image and push it

Docker must be healthy (`docker info`). Then:

```bash
cd /Users/ashishmishra/Documents/affiliate
bash scripts/aws/build-push.sh staging
```

This builds the Next.js image and pushes `:staging` to **your** ECR. First build can take 5–15 minutes.

If Docker can’t pull `node:20-alpine`:

```bash
colima stop && colima start
docker pull node:20-alpine
bash scripts/aws/build-push.sh staging
```

---

## Phase F — Turn the website on (second apply)

Edit `infra/terraform/terraform.tfvars` and change **only** this line:

```hcl
enable_web_service = true
```

Then:

```bash
bash scripts/aws/infra-up.sh
```

Type `yes`. This creates the Fargate service (1 task) behind the ALB/CloudFront you already have.

Wait until the service is stable (2–5 minutes). ECS may restart once or twice while the task starts.

---

## Phase G — Database schema (inside the VPC)

`migrate.sh` starts a Fargate task in the public subnets. That task can reach private RDS; your Mac cannot.

If you applied Terraform **before** the migrate task existed, re-apply and merge the new keys first:

```bash
bash scripts/aws/infra-up.sh
# merge .env.aws.generated → .env.aws
# must include ECS_MIGRATE_TASK_FAMILY, ECS_SUBNETS, ECS_WEB_SG
bash scripts/aws/build-push.sh staging   # pushes :staging-migrate
bash scripts/aws/migrate.sh staging
```

That is `prisma migrate deploy` **on Fargate**, not on this laptop. A local Prisma P1001 against `*.rds.amazonaws.com` means you ran Prisma here — use the script above.

Do **not** `export DATABASE_URL=…rds…` and run `pnpm db:seed` on the Mac. Same private-RDS wall.

Staging sample catalog (Nike, Amazon, Target, …) — in-VPC only:

```bash
# after migrate image includes src/lib (rebuild if you just added seed.sh)
bash scripts/aws/build-push.sh staging
bash scripts/aws/seed.sh staging
```

That upserts the demo merchants/offers. Prod: `bash scripts/aws/seed.sh prod --no-demo` (market + admin only; demo is refused).

---

## Phase H — Prove it works

```bash
CF="$(cd infra/terraform && terraform output -raw cloudfront_url)"
echo "$CF"

# After demo seed:
SMOKE_STORE_SLUG=nike pnpm smoke "$CF"
```

If you already know an offer id (from admin or a later in-VPC seed):

```bash
SMOKE_STORE_SLUG=nike SMOKE_OFFER_ID='paste-uuid' pnpm smoke "$CF"
```

Open in the browser:

- `$CF/` — home  
- `$CF/store/nike` — store (after demo seed)  
- `$CF/admin/login` — `admin@example.com` / `changeme` (if you seeded)  
- `$CF/api/health` — `{"ok":true,"db":"up"}`

US and Europe both hit this CloudFront URL; pages cache at nearby edges; `/go` still goes to `us-east-1`.

---

## After you’re live — daily loop

New code on this machine:

```bash
bash scripts/aws/release.sh staging
```

That tests, rebuilds, migrates, redeploys, smokes. No Terraform unless you change infra.

**Production (later):** copy `infra/terraform/prod.tfvars.example` to a **separate** apply (new workspace or new directory). Do **not** change `environment = "staging"` to `prod` in place. Never `db:seed:demo` on prod.

---

## If you want to delete everything and stop billing

```bash
bash scripts/aws/infra-down.sh
```

Type `destroy`. Check the AWS Billing console the next day that RDS/ALB/Fargate/CloudFront are gone.

---

## Common stops

| Symptom | What to do |
|---------|------------|
| `Unable to locate credentials` | `aws configure --profile coupon-hub` again; use `--profile coupon-hub` |
| `docker: Cannot connect` | `colima start` |
| `terraform: command not found` | `brew install terraform` |
| First `infra-up` asks to create 40+ resources | That’s expected — type `yes` |
| `build-push` / ECR login fails | Confirm `aws sts get-caller-identity --profile coupon-hub` |
| Prisma `P1001` from this Mac | Expected — RDS is private. Re-apply Terraform, merge `ECS_MIGRATE_*` into `.env.aws`, `build-push.sh`, then `migrate.sh` |
| Site 502 on CloudFront | Wait 3–5 min; `enable_web_service` true? Image pushed? |
| Health 503 | RDS/security group or `DATABASE_URL` secret |

---

## What you are *not* doing

- Creating ECR, RDS, VPC, ALB, or CloudFront in the console  
- GitHub OIDC or putting AWS keys in GitHub  
- A second region in Europe  
- A custom domain (optional later: ACM + Route 53 + `public_base_url`)
