import os
import sys
import requests
from datetime import datetime, timezone
from pywebpush import webpush, WebPushException

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://zebyzpsffpvdaoqrhonq.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIM_EMAIL = "mailto:admin@bobo.com"

headers = {
    "apikey": SUPABASE_KEY or "",
    "Authorization": f"Bearer {SUPABASE_KEY or ''}",
    "Content-Type": "application/json"
}

def check_and_send_push():
    if not SUPABASE_KEY or not SUPABASE_URL or not VAPID_PRIVATE_KEY:
        print("⚠️ Missing Supabase or VAPID credentials.")
        return

    try:
        # 1. משיכת ההאכלות האחרונות
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/feedings?select=*&order=created_at.desc&limit=10",
            headers=headers,
            timeout=10
        )
        if res.status_code != 200 or not res.json():
            print(f"⚠️ Failed to fetch feedings: {res.status_code}")
            return

        feedings = res.json()
        significant_feed = None

        for f in feedings:
            notes = f.get("notes") or ""
            f_type = f.get("type")
            amount = f.get("amount_ml") or 0

            is_vit_d = "ויטמין D" in notes
            is_pumping = "[שאיבת_חלב]" in notes or f_type == "pumping"
            is_significant = f_type == "breastfeeding" or (f_type == "bottle" and amount >= 60)

            if not is_vit_d and not is_pumping and is_significant:
                significant_feed = f
                break

        if not significant_feed:
            print("ℹ️ No significant feeding found.")
            return

        feed_id = str(significant_feed.get("id"))
        last_time_str = significant_feed.get("created_at").replace("Z", "+00:00")
        last_time = datetime.fromisoformat(last_time_str)
        now = datetime.now(timezone.utc)

        interval_hours = 3.0
        lead_minutes = 10.0

        elapsed_minutes = (now - last_time).total_seconds() / 60.0
        target_minutes = interval_hours * 60.0
        remaining_minutes = target_minutes - elapsed_minutes

        print(f"ℹ️ Feed ID: {feed_id} | Remaining: {remaining_minutes:.2f} mins")

        # 2. בדיקת נעילה - האם כבר נשלחה התראה להאכלה הספציפית הזו
        lock_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/sticky_notes?id=eq.last_push_id&select=content",
            headers=headers,
            timeout=10
        )
        if lock_res.status_code == 200:
            data = lock_res.json()
            if data and len(data) > 0 and str(data[0].get("content")) == feed_id:
                print(f"🔒 Notification already sent for Feed ID {feed_id}. Skipping.")
                return

        # 3. חלון שליחה: בין 10 דקות לפני הזמן ל-0 דקות
        if 0.0 <= remaining_minutes <= lead_minutes:
            print(f"🚀 Time window matched! Sending notification for Feed ID {feed_id}...")

            # רישום נעילה מיידי ב-DB
            requests.post(
                f"{SUPABASE_URL}/rest/v1/sticky_notes",
                headers={**headers, "Prefer": "resolution=merge-duplicates"},
                json={"id": "last_push_id", "content": feed_id},
                timeout=10
            )

            # שליפה ושליחה לכל המכשירים הרשומים
            subs_res = requests.get(
                f"{SUPABASE_URL}/rest/v1/push_subscriptions?select=*",
                headers=headers,
                timeout=10
            )

            if subs_res.status_code == 200:
                subscriptions = subs_res.json()
                unique_endpoints = set()
                payload = '{"title": "⏰ תזכורת האכלה", "body": "האכלה הבאה של בובו בעוד כ-10 דקות"}'

                for sub in subscriptions:
                    endpoint = sub.get("endpoint")
                    p256dh = sub.get("p256dh")
                    auth = sub.get("auth")

                    if endpoint and p256dh and auth and endpoint not in unique_endpoints:
                        unique_endpoints.add(endpoint)
                        push_info = {
                            "endpoint": endpoint,
                            "keys": {
                                "p256dh": p256dh,
                                "auth": auth
                            }
                        }
                        try:
                            webpush(
                                subscription_info=push_info,
                                data=payload,
                                vapid_private_key=VAPID_PRIVATE_KEY,
                                vapid_claims={"sub": VAPID_CLAIM_EMAIL}
                            )
                            print(f"✅ Push delivered to: {endpoint[:35]}...")
                        except WebPushException as ex:
                            print(f"⚠️ Push service error: {ex}")
                        except Exception as ex:
                            print(f"⚠️ Error sending to endpoint: {ex}")
        else:
            print(f"⏳ Outside trigger window ({remaining_minutes:.2f} mins remaining).")

    except Exception as e:
        print(f"❌ Error in check_and_send_push: {e}")

if __name__ == "__main__":
    check_and_send_push()
