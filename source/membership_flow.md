# EquipHK — Membership & Rental System: Layout & Flow

---

## 1. User Journey Overview

```
[Homepage / Pricing Section]
        |
        ├── "Get Started Free" → Pay-As-You-Go Registration
        └── "Join Trade Pro"   → Trade Pro Registration
                |
        [Registration Page /register]
                |
        [Account Dashboard /account]
                |
        [Browse Equipment → Add to Cart → Checkout → Booking Confirmed]
                |
        [Admin receives WhatsApp + Email notification]
```

---

## 2. Page-by-Page Layout

---

### Page 1 — Pricing Section (already exists, needs wiring)

**Location:** Homepage → scroll to #pricing, or direct link `/pricing`

| Element | Detail |
|---|---|
| Two plan cards side by side | Pay-As-You-Go (left) · Trade Pro (right, highlighted) |
| Pay-As-You-Go CTA | "Get Started — It's Free" → `/register?plan=payg` |
| Trade Pro CTA | "Join Trade Pro — From HK$499/mo" → `/register?plan=trade-pro` |
| Trade Pro badge | "Most Popular" orange banner |

---

### Page 2 — Registration Page `/register`

**Step 1 of 3 — Choose Your Plan** (if arriving without `?plan=`)

```
┌─────────────────────────────────────────────────────────┐
│  EQUIPHK                                                │
│  ─────────────────────────────────────────────────────  │
│  Choose Your Account Type                               │
│                                                         │
│  ┌───────────────────┐   ┌───────────────────────────┐  │
│  │  Pay-As-You-Go    │   │  Trade Pro ★ Popular      │  │
│  │  Free             │   │  From HK$499/month        │  │
│  │                   │   │                           │  │
│  │  • Standard rates │   │  • 10–15% off all rates   │  │
│  │  • Full catalogue │   │  • Priority booking       │  │
│  │  • HKID + deposit │   │  • Waived deposits <$5K   │  │
│  │  • Email support  │   │  • Monthly invoicing      │  │
│  │                   │   │  • Free delivery >$500    │  │
│  │  [Select]         │   │  [Select]                 │  │
│  └───────────────────┘   └───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Step 2 of 3 — Your Details**

```
┌─────────────────────────────────────────────────────────┐
│  Create Your Account                                    │
│  ─────────────────────────────────────────────────────  │
│  Full Name          [                              ]    │
│  Email Address      [                              ]    │
│  Phone (WhatsApp)   [+852                          ]    │
│  Company Name       [Optional — for Trade Pro      ]    │
│  Password           [                              ]    │
│  Confirm Password   [                              ]    │
│                                                         │
│  ── For Pay-As-You-Go ──                                │
│  HKID Number        [                              ]    │
│  (Used for identity verification & deposit hold)        │
│                                                         │
│  ── For Trade Pro ──                                    │
│  Business Reg. No.  [Optional                      ]    │
│  Monthly Budget     [Dropdown: <$5K / $5K–$20K / $20K+]│
│                                                         │
│  [← Back]                    [Continue →]              │
└─────────────────────────────────────────────────────────┘
```

**Step 3 of 3 — Review & Confirm**

```
┌─────────────────────────────────────────────────────────┐
│  Review Your Registration                               │
│  ─────────────────────────────────────────────────────  │
│  Plan:    Trade Pro — HK$499/month                      │
│  Name:    Benjamin Casey                                │
│  Email:   ben@equiphk.com                               │
│  Phone:   +852 9832 5789                                │
│                                                         │
│  ✓ I agree to EquipHK Terms & Conditions                │
│  ✓ I agree to the Equipment Rental Agreement            │
│                                                         │
│  [← Back]              [Create Account & Start Renting] │
└─────────────────────────────────────────────────────────┘
```

**On Submit:**
- Account created (or linked to existing Manus login)
- Membership record saved to DB
- Welcome email sent to user
- Admin notified via WhatsApp + email: "New [Trade Pro] registration: Benjamin Casey"

---

### Page 3 — Account Dashboard `/account`

```
┌─────────────────────────────────────────────────────────┐
│  EQUIPHK  |  My Account                                 │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  👤 Benjamin Casey          TRADE PRO  ★        │    │
│  │  Member since: April 2026                       │    │
│  │  Next invoice: 5 May 2026   HK$499/month        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── Active Rentals ──────────────────────────────────   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Makita 18V Drill    Hired: 3 Apr  Return: 7 Apr │   │
│  │  HK$120/day × 4 days = HK$480  (-10% = HK$432)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ── Rental History ──────────────────────────────────   │
│  [Table: Date | Item | Duration | Total | Status]       │
│                                                         │
│  ── Invoices ────────────────────────────────────────   │
│  [April 2026 — HK$1,240  Download PDF]                  │
│                                                         │
│  [Upgrade to Trade Pro]  (shown only for PAYG users)    │
└─────────────────────────────────────────────────────────┘
```

---

### Page 4 — Checkout / Booking Confirmation

**Cart page already exists — additions needed:**

| Addition | Detail |
|---|---|
| Membership badge | Shows "Trade Pro — 10% discount applied" in cart summary |
| Deposit line | PAYG: shows deposit hold amount. Trade Pro <$5K: "Deposit waived" |
| Delivery fee | PAYG: HK$150 delivery. Trade Pro >$500 order: "Free delivery" |
| Submit booking | Saves rental_booking to DB, triggers notifications |

---

## 3. Automated Notification Flow

```
User submits booking
        │
        ▼
  rental_bookings table
  (userId, items, dates, total, tier, status)
        │
        ├──► Email to admin (info@equiphk.com)
        │    Subject: "New Rental Booking — [Name] — [Plan]"
        │    Body: Item list, dates, total, contact details, WhatsApp link
        │
        └──► WhatsApp to designated number
             Message: "🔔 New EquipHK Booking
             Name: Benjamin Casey (Trade Pro)
             Items: Makita 18V Drill × 4 days
             Total: HK$432 (after discount)
             Phone: +852 9832 5789
             📋 View in Admin: equip.hk/admin/bookings"
```

**Notification triggers:**
| Event | Notification |
|---|---|
| New registration (either tier) | WhatsApp + email to admin |
| New rental booking submitted | WhatsApp + email to admin |
| Trade Pro upgrade | WhatsApp + email to admin |
| Booking status change (admin confirms/cancels) | Email to customer |

---

## 4. Admin Panel Additions

**New tab in admin: "Members"**

```
┌──────────────────────────────────────────────────────────┐
│  Members                                                 │
│  ────────────────────────────────────────────────────── │
│  Filter: All | Pay-As-You-Go | Trade Pro                 │
│                                                          │
│  Name          | Plan        | Joined    | Bookings | ▼  │
│  Benjamin Casey | Trade Pro  | Apr 2026  | 3        |    │
│  John Lam       | PAYG       | Mar 2026  | 1        |    │
└──────────────────────────────────────────────────────────┘
```

**New tab in admin: "Bookings"**

```
┌──────────────────────────────────────────────────────────┐
│  Rental Bookings                                         │
│  ────────────────────────────────────────────────────── │
│  Filter: All | Pending | Confirmed | Active | Completed  │
│                                                          │
│  #  | Customer       | Items | Dates      | Total  | Status    │
│  1  | Benjamin Casey | 2     | 3–7 Apr    | HK$864 | Confirmed │
│  2  | John Lam       | 1     | 5 Apr      | HK$120 | Pending   │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Database Tables (New)

| Table | Key Fields |
|---|---|
| `user_memberships` | userId, plan (payg/trade_pro), status, monthlyFee, startDate, hkidNumber, companyName |
| `rental_bookings` | id, userId, status, items (JSON), startDate, endDate, subtotal, discount, deliveryFee, depositAmount, totalAmount, notes |

---

## 6. Discount & Fee Logic Summary

| Rule | Pay-As-You-Go | Trade Pro |
|---|---|---|
| Discount on rates | None | 10–15% off |
| Deposit | Required (card hold) | Waived for items under HK$5,000 |
| Delivery fee | HK$150 flat | Free on orders over HK$500 |
| Invoicing | Per booking | Monthly consolidated |
| Membership fee | Free | HK$499/month |

---

## 7. Questions Before Building

1. **Notification number** — What WhatsApp number should receive admin alerts? (e.g. your +852 9832 5789?)
2. **Notification email** — What email address should receive booking alerts?
3. **Trade Pro discount** — Fixed 10% or variable (10% standard, 15% for orders over a threshold)?
4. **Payment for Trade Pro membership** — Should the HK$499/month be collected via Stripe, or is it invoiced manually for now?
5. **HKID verification** — Is this just a field they fill in (honour system), or do you want them to upload a photo of their HKID?
