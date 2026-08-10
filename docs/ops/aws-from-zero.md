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

Get your public IP (for database migrate from this Mac):

```bash
curl -s https://checkip.amazonaws.com
```

You’ll get something like `203.0.113.10`. Remember it as `YOUR_IP`.

---

## Phase C — Tell Terraform who you are

```bash
cd /Users/ashishmishra/Documents/affiliate
cp infra/terraform/staging.tfvars.example infra/terraform/terraform.tfvars
```

Edit `infra/terraform/terraform.tfvars` in any editor. It should look like this (use **your** IP):

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

operator_cidr = "YOUR_IP/32"
```

Replace `YOUR_IP` with the number from `checkip.amazonaws.com`, and keep `/32`.  
Example: `operator_cidr = "203.0.113.10/32"`.

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

## Phase G — Database schema + demo data

Still from the repo root (your IP is allowed via `operator_cidr`):

```bash
bash scripts/aws/migrate.sh staging
```

That runs `prisma migrate deploy` against **RDS**, not your local Postgres.

Optional demo catalog (Nike etc.) on **staging only**:

```bash
# URL is in AWS Secrets Manager; migrate.sh already used it.
# Seed using the same secret:
export DATABASE_URL="$(aws secretsmanager get-secret-value \
  --profile coupon-hub --region us-east-1 \
  --secret-id "$(grep STAGING_DATABASE_SECRET_ID .env.aws | cut -d= -f2-)" \
  --query SecretString --output text)"
pnpm db:seed
pnpm db:seed:demo
```

If `migrate.sh` times out: your home IP may have changed. Re-run `curl -s https://checkip.amazonaws.com`, update `operator_cidr`, `infra-up.sh` again, retry migrate.

---

## Phase H — Prove it works

```bash
CF="$(cd infra/terraform && terraform output -raw cloudfront_url)"
echo "$CF"

# After demo seed:
SMOKE_STORE_SLUG=nike pnpm smoke "$CF"
```

If you have an offer id (from seed/demo):

```bash
# get one id (uses DATABASE_URL from Phase G)
pnpm exec tsx -e 'import {PrismaClient} from "@prisma/client";
const p=new PrismaClient();
const o=await p.offer.findFirst({where:{status:"active"},select:{id:true}});
console.log(o?.id); await p.$disconnect();'
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
| `migrate.sh` cannot connect | IP changed → update `operator_cidr` → `infra-up.sh` |
| Site 502 on CloudFront | Wait 3–5 min; `enable_web_service` true? Image pushed? |
| Health 503 | RDS/security group or `DATABASE_URL` secret |

---

## What you are *not* doing

- Creating ECR, RDS, VPC, ALB, or CloudFront in the console  
- GitHub OIDC or putting AWS keys in GitHub  
- A second region in Europe  
- A custom domain (optional later: ACM + Route 53 + `public_base_url`)
