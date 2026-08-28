import os
import requests
from datetime import datetime, timezone
from pywebpush import webpush, WebPushException
import os
import requests
from datetime import datetime, timezone
from pywebpush import webpush, WebPushException

# 1. תיקון כתובת: משיכה דינמית מהמשתנים של גיטהאב
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

VAPID_CLAIM_EMAIL = "mailto:admin@bobo.com"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def check_and_send_push():
    if not SUPABASE_KEY or not SUPABASE_URL:
        print("Missing Supabase credentials")
        return

    # משיכת 10 האכלות אחרונות כדי לסנן ולמצוא את ההאכלה המשמעותית האמיתית
    res = requests.get(f"{SUPABASE_URL}/rest/v1/feedings?select=*&order=created_at.desc&limit=10", headers=headers)
    if res.status_code != 200 or not res.json():
        print("No feedings found or error fetching data")
        return

    feedings = res.json()
    significant_feed = None

    # 3. תיקון לוגיקה: סינון האכלה משמעותית בדיוק כמו באפליקציה
    for f in feedings:
        notes = f.get("notes", "") or ""
        f_type = f.get("type")
        amount = f.get("amount_ml") or 0
        
        is_vit_d = "ויטמין D" in notes
        is_pumping = "[שאיבת_חלב]" in notes or f_type == "pumping"
        is_significant = f_type == "breastfeeding" or (f_type == "bottle" and amount >= 60)
        
        if not is_vit_d and not is_pumping and is_significant:
            significant_feed = f
            break

    if not significant_feed:
        print("No significant feeding found")
        return

    feed_id = significant_feed.get("id")
    last_time_str = significant_feed.get("created_at")
    last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)

    interval_hours = 3.0 
    lead_minutes = 10

    elapsed_hours = (now - last_time).total_seconds() / 3600.0
    remaining_minutes = (interval_hours - elapsed_hours) * 60

    print(f"Remaining: {remaining_minutes:.2f} mins")

    # בדיקה האם כבר שלחנו התראה להאכלה הזו (מונע כפילויות)
    note_res = requests.get(f"{SUPABASE_URL}/rest/v1/sticky_notes?id=eq.last_push_id&select=content", headers=headers)
    if note_res.status_code == 200 and len(note_res.json()) > 0:
        if note_res.json()[0].get("content") == str(feed_id):
            print("Already sent notification for this specific feed.")
            return

    # אם אנחנו בחלון הזמן הנכון
    if 0 <= remaining_minutes <= lead_minutes:
        print("Time to send notification!")
        subs_res = requests.get(f"{SUPABASE_URL}/rest/v1/push_subscriptions?select=*", headers=headers)
        if subs_res.status_code == 200:
            for sub in subs_res.json():
                endpoint = sub.get('endpoint')
                p256dh = sub.get('p256dh')
                auth = sub.get('auth')
                
                if endpoint and p256dh and auth:
                    push_info = {
                        "endpoint": endpoint,
                        "keys": {
                            "p256dh": p256dh,
                            "auth": auth
                        }
                    }
                    payload = '{"title": "⏰ מתקרב מועד האכלה!", "body": "תזכורת: הגיע הזמן להתכונן להאכלה הבאה של בובו"}'
                    try:
                        webpush(
                            subscription_info=push_info,
                            data=payload,
                            vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY", ""),
                            vapid_claims={"sub": VAPID_CLAIM_EMAIL}
                        )
                        print(f"Push sent successfully to {endpoint}")
                    except Exception as e:
                        print(f"Error sending push: {e}")
            
            # 4. שמירת מזהה ההאכלה כדי לא לשלוח שוב (תיקון כפילויות)
            requests.post(
                f"{SUPABASE_URL}/rest/v1/sticky_notes",
                headers={**headers, "Prefer": "resolution=merge-duplicates"},
                json={"id": "last_push_id", "content": str(feed_id)}
            )
    else:
        print("Not time yet.")

if __name__ == "__main__":
    check_and_send_push()

# כתובת Supabase מוטמעת ישירות
SUPABASE_URL = "https://zyejobjucmjpumdiczbt.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

VAPID_CLAIM_EMAIL = "mailto:admin@bobo.com"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def check_and_send_push():
    if not SUPABASE_KEY:
        print("Missing Supabase Anon Key")
        return

    res = requests.get(f"{SUPABASE_URL}/rest/v1/feedings?select=*&order=created_at.desc&limit=1", headers=headers)
    if res.status_code != 200 or not res.json():
        print("No feedings found or error fetching data")
        return

    last_feed = res.json()[0]
    notes = last_feed.get("notes", "") or ""

    if "ויטמין D" in notes or "[שאיבת_חלב]" in notes or last_feed.get("type") == "pumping":
        print("Last action was not a significant feeding")
        return

    last_time_str = last_feed.get("created_at")
    last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)

    interval_hours = 3.0 
    lead_minutes = 10

    elapsed_hours = (now - last_time).total_seconds() / 3600.0
    remaining_minutes = (interval_hours - elapsed_hours) * 60

    print(f"Remaining: {remaining_minutes:.2f} mins")

    if 0 <= remaining_minutes <= lead_minutes:
        print("Time to send notification!")
        subs_res = requests.get(f"{SUPABASE_URL}/rest/v1/push_subscriptions?select=*", headers=headers)
        if subs_res.status_code == 200:
            for sub in subs_res.json():
                endpoint = sub.get('endpoint')
                p256dh = sub.get('p256dh')
                auth = sub.get('auth')
                
                if endpoint and p256dh and auth:
                    push_info = {
                        "endpoint": endpoint,
                        "keys": {
                            "p256dh": p256dh,
                            "auth": auth
                        }
                    }
                    payload = '{"title": "בובו - מעקב תינוקות", "body": "הגיע הזמן להתכונן להאכלה הבאה!"}'
                    try:
                        webpush(
                            subscription_info=push_info,
                            data=payload,
                            vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY", ""),
                            vapid_claims={"sub": VAPID_CLAIM_EMAIL}
                        )
                        print(f"Push sent successfully to {endpoint}")
                    except Exception as e:
                        print(f"Error sending push: {e}")
    else:
        print("Not time yet.")

if __name__ == "__main__":
    check_and_send_push()
