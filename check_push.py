import os
import sys
import traceback
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
    try:
        if not SUPABASE_KEY or not SUPABASE_URL:
            print("⚠️ Missing Supabase credentials in Environment/Secrets.")
            return

        # משיכת 10 ההאכלות האחרונות
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/feedings?select=*&order=created_at.desc&limit=10",
            headers=headers,
            timeout=15
        )

        if res.status_code != 200:
            print(f"⚠️ Supabase error (HTTP {res.status_code}): {res.text}")
            return

        feedings = res.json()
        if not isinstance(feedings, list) or len(feedings) == 0:
            print("ℹ️ No feedings found in table.")
            return

        significant_feed = None
        for f in feedings:
            if not isinstance(f, dict):
                continue

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

        feed_id = significant_feed.get("id")
        last_time_str = significant_feed.get("created_at")
        if not last_time_str:
            print("⚠️ Missing created_at on last feed.")
            return

        # פענוח תאריך תקני
        clean_time_str = last_time_str.replace("Z", "+00:00")
        last_time = datetime.fromisoformat(clean_time_str)
        now = datetime.now(timezone.utc)

        interval_hours = 3.0
        lead_minutes = 10

        elapsed_hours = (now - last_time).total_seconds() / 3600.0
        remaining_minutes = (interval_hours - elapsed_hours) * 60

        print(f"ℹ️ Feed ID: {feed_id} | Remaining: {remaining_minutes:.2f} mins")

        # בדיקה האם כבר נשלחה התראה להאכלה זו
        note_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/sticky_notes?id=eq.last_push_id&select=content",
            headers=headers,
            timeout=10
        )
        if note_res.status_code == 200:
            notes_data = note_res.json()
            if isinstance(notes_data, list) and len(notes_data) > 0:
                if str(notes_data[0].get("content")) == str(feed_id):
                    print("ℹ️ Already sent notification for this specific feed.")
                    return

        # בדיקת חלון הזמן לשליחת התראה
        if 0 <= remaining_minutes <= lead_minutes:
            print("🚀 Time to send notification!")

            if not VAPID_PRIVATE_KEY:
                print("⚠️ VAPID_PRIVATE_KEY is missing. Cannot send WebPush.")
                return

            subs_res = requests.get(
                f"{SUPABASE_URL}/rest/v1/push_subscriptions?select=*",
                headers=headers,
                timeout=10
            )

            if subs_res.status_code == 200 and isinstance(subs_res.json(), list):
                unique_endpoints = set()
                payload = '{"title": "⏰ מתקרב מועד האכלה!", "body": "תזכורת: הגיע הזמן להתכונן להאכלה הבאה של בובו"}'

                for sub in subs_res.json():
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
                            print(f"✅ Push sent successfully to {endpoint[:30]}...")
                        except WebPushException as ex:
                            print(f"⚠️ WebPush error: {ex}")
                        except Exception as ex:
                            print(f"⚠️ General push error: {ex}")

                # שמירת מזהה ההאכלה למניעת כפילות
                requests.post(
                    f"{SUPABASE_URL}/rest/v1/sticky_notes",
                    headers={**headers, "Prefer": "resolution=merge-duplicates"},
                    json={"id": "last_push_id", "content": str(feed_id)},
                    timeout=10
                )
        else:
            print("⏳ Not time yet.")

    except Exception as e:
        print(f"❌ Unhandled Exception in check_and_send_push: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    check_and_send_push()
