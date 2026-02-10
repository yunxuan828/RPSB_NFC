# Email Module – How to Test

## 0. Ensure queue and cache tables exist

If the queue worker fails with "Table 'cache' doesn't exist" or "Table 'jobs' doesn't exist", run:

```bash
cd deployment/docker
docker exec nfc-v2-backend php artisan queue:table
docker exec nfc-v2-backend php artisan queue:failed-table
docker exec nfc-v2-backend php artisan cache:table
docker exec nfc-v2-backend php artisan migrate --force
docker restart nfc-v2-queue
```

## 1. Prerequisites

- At least **one customer** with a valid **email** in the CRM.
- You are **logged in** as admin (not employee portal).
- Queue worker is running: `docker ps | grep nfc-v2-queue`

---

## 2. Test via UI (recommended)

### A. Create a template
1. Go to **CRM → Email Templates**.
2. Click **New Template**.
3. Fill: Name, Subject, Body (e.g. `Hello {{customer.full_name}}, ...`).
4. **Save**. Status should be **Draft**.

### B. Create and send a campaign
1. Go to **CRM → Campaigns** → **New Campaign**.
2. **Campaign name**: e.g. "Test Run".
3. **Select template**: choose the draft you created.
4. **Audience**: pick at least one status (e.g. Lead) or leave all; add search if needed.
5. Click **Update Preview** → you should see a **count** and sample recipients.
6. Click **Create Campaign**.
7. Open the new campaign → click **Send Campaign** and confirm.

### C. Check that it worked
- **Campaign page**: Status should go **queued → sending → completed**. Totals (target / sent / failed) should update.
- **Queue worker logs**:  
  `docker logs -f nfc-v2-queue`  
  You should see jobs being processed (e.g. "Processing: App\Jobs\SendCampaignJob", "Processing: App\Jobs\SendRecipientEmailJob").
- **Customer profile**: Open a recipient customer → **Timeline** tab. There should be an **email_sent** activity with subject and date.

### D. Where “sent” emails go (default config)
- With **MAIL_MAILER=log** (Laravel default when not set), mail is **not** sent over the network; it’s written to the log.
- To see the “sent” content:  
  `docker exec nfc-v2-backend tail -100 /var/www/backend/storage/logs/laravel.log`  
  Search for the subject or "Message-ID".

---

## 3. Quick CLI check (optional)

Run inside the backend container:

```bash
# 1. List templates
docker exec nfc-v2-backend php artisan tinker --execute="echo json_encode(\App\Models\CrmEmailTemplate::latest()->take(3)->get(['id','template_code','name','status'])->toArray(), JSON_PRETTY_PRINT);"

# 2. List campaigns and their status
docker exec nfc-v2-backend php artisan tinker --execute="echo json_encode(\App\Models\CrmEmailCampaign::with('template:id,name')->latest()->take(5)->get(['id','name','status','totals'])->toArray(), JSON_PRETTY_PRINT);"

# 3. Pending jobs (should go down when worker runs)
docker exec nfc-v2-backend php artisan tinker --execute="echo 'Jobs in queue: ' . \Illuminate\Support\Facades\DB::table('jobs')->count();"
```

---

## 4. If something fails

| Symptom | What to check |
|--------|----------------|
| Campaign stays **queued** | Is `nfc-v2-queue` running? `docker ps \| grep queue`. Restart: `docker restart nfc-v2-queue`. |
| **Failed** recipients | `docker logs nfc-v2-queue` for exceptions. Check recipient has valid email; check MAIL_* if using real SMTP. |
| No **email_sent** on timeline | Ensure the customer was in the campaign and the send job completed (check campaign recipients and queue logs). |
| 401 on API | Log in again; session might have expired. |

---

## 5. Test with real SMTP (optional)

To send real emails, set in backend `.env` (or in `docker-compose` `environment` for backend and queue-worker):

- `MAIL_MAILER=smtp`
- `MAIL_HOST=...`, `MAIL_PORT=...`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`

Then restart backend and queue worker so they pick up the new config.
