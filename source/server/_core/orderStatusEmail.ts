/**
 * Order Status Email Notifications
 * Sends branded transactional emails to customers when their order status changes.
 *
 * Triggers:
 *   confirmed  → "Your equipment is confirmed and being prepared"
 *   active     → "Your equipment is on its way / ready for collection"
 *   completed  → "Thank you — your rental is complete"
 *   cancelled  → "Your order has been cancelled"
 */
import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "EquipHK <noreply@equip.hk>";
const ADMIN_EMAIL = "Bookings@Equip.hk";
const SITE_URL = "https://www.equip.hk";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY ?? "";
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

function formatHKD(val: string | number): string {
  return `HK$${Number(val).toLocaleString("en-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-HK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Shared layout helpers ────────────────────────────────────────────────────

function emailHeader(badgeColor: string, badgeText: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a; padding: 32px 40px;">
    <tr>
      <td>
        <span style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
          EQUIP<span style="color: #f97316;">HK</span>
        </span>
        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
          Rent Anything. Build Everything.
        </p>
      </td>
      <td align="right">
        <span style="background-color: ${badgeColor}; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700;">
          ${badgeText}
        </span>
      </td>
    </tr>
  </table>`;
}

function emailFooter(): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a; padding: 24px 40px; text-align: center;">
    <tr>
      <td>
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
          EquipHK — Kowloon Construction Company Limited<br>
          <a href="mailto:Bookings@Equip.hk" style="color: #f97316; text-decoration: none;">Bookings@Equip.hk</a>
          &nbsp;|&nbsp;
          <a href="tel:+85298325789" style="color: #f97316; text-decoration: none;">+852 9832 5789</a>
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 11px;">
          This is an automated message. Please retain for your records.&nbsp;
          <a href="${SITE_URL}/terms" style="color: #6b7280; text-decoration: none;">Terms & Conditions</a>
        </p>
      </td>
    </tr>
  </table>`;
}

function wrapEmail(headerHtml: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr><td>${headerHtml}</td></tr>
        <tr><td style="padding:40px;">${bodyHtml}</td></tr>
        <tr><td>${emailFooter()}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Data types ───────────────────────────────────────────────────────────────

export interface OrderStatusEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  rentalStartDate: string | Date;
  rentalEndDate: string | Date;
  rentalDays: number;
  totalAmount: string | number;
  deliveryType: "delivery" | "self_collection";
  deliveryAddress?: string | null;
  returnAddress?: string | null;
  itemNames: string[];
  membershipPlan: string;
  fuelType?: string | null;
  fuelLitres?: string | number | null;
  fuelCost?: string | number | null;
  // Delivery slot info (optional)
  deliverySlotDate?: string | Date | null;
  deliverySlotTime?: string | null;
  collectionSlotDate?: string | Date | null;
  collectionSlotTime?: string | null;
}

// ─── Template: CONFIRMED ──────────────────────────────────────────────────────

function buildConfirmedEmail(data: OrderStatusEmailData): { subject: string; html: string } {
  const subject = `EquipHK — Order #${data.orderId} Confirmed ✓`;
  const itemsHtml = data.itemNames
    .map((n) => `<li style="padding:4px 0;color:#374151;">${n}</li>`)
    .join("");

  const slotHtml =
    data.deliverySlotDate
      ? `<tr>
           <td style="color:#6b7280;font-size:13px;padding-bottom:6px;">Delivery Slot</td>
           <td style="color:#0a0e1a;font-weight:600;text-align:right;padding-bottom:6px;">
             ${formatDate(data.deliverySlotDate)} — ${data.deliverySlotTime ?? ""}
           </td>
         </tr>`
      : "";

  const fuelHtml =
    data.fuelType && data.fuelType !== "none" && Number(data.fuelLitres ?? 0) > 0
      ? `<tr>
           <td style="padding:6px 0;color:#374151;">Fuel Add-On (${data.fuelType}, ${data.fuelLitres}L)</td>
           <td style="padding:6px 0;color:#374151;text-align:right;">${formatHKD(data.fuelCost ?? 0)}</td>
         </tr>`
      : "";

  const body = `
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
    <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;color:#0a0e1a;">Order #${data.orderId}</h1>

    <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
      Hi <strong>${data.customerName}</strong>,<br>
      Great news — your rental order has been <strong>confirmed</strong>. We're preparing your equipment and will have it ready for the scheduled date.
    </p>

    <!-- Equipment -->
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#0a0e1a;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Equipment</p>
      <ul style="margin:0;padding-left:20px;">${itemsHtml}</ul>
    </div>

    <!-- Rental Period -->
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#0a0e1a;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Rental Period</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#6b7280;font-size:13px;padding-bottom:6px;">Start Date</td>
          <td style="color:#0a0e1a;font-weight:600;text-align:right;padding-bottom:6px;">${formatDate(data.rentalStartDate)}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding-bottom:6px;">End Date</td>
          <td style="color:#0a0e1a;font-weight:600;text-align:right;padding-bottom:6px;">${formatDate(data.rentalEndDate)}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;">Duration</td>
          <td style="color:#0a0e1a;font-weight:600;text-align:right;">${data.rentalDays} day${data.rentalDays !== 1 ? "s" : ""}</td>
        </tr>
        ${slotHtml}
      </table>
    </div>

    <!-- Payment -->
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#0a0e1a;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Payment</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${fuelHtml}
        <tr style="border-top:2px solid #e5e7eb;">
          <td style="padding:12px 0 6px;font-weight:900;color:#0a0e1a;font-size:16px;">Total</td>
          <td style="padding:12px 0 6px;font-weight:900;color:#f97316;font-size:18px;text-align:right;">${formatHKD(data.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- Delivery -->
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#0a0e1a;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">
        ${data.deliveryType === "delivery" ? "Delivery" : "Self-Collection"}
      </p>
      ${data.deliveryType === "delivery" && data.deliveryAddress
        ? `<p style="margin:0;color:#374151;">${data.deliveryAddress}</p>`
        : `<p style="margin:0;color:#374151;">Please collect from our depot. We'll confirm the exact address and time shortly.</p>`
      }
    </div>

    <!-- Support -->
    <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
      <p style="margin:0;color:#374151;font-size:14px;">Questions? We're here to help:</p>
      <p style="margin:8px 0 0;color:#374151;font-size:14px;">
        📧 <a href="mailto:Bookings@Equip.hk" style="color:#f97316;text-decoration:none;">Bookings@Equip.hk</a>&nbsp;&nbsp;
        📞 <a href="tel:+85298325789" style="color:#f97316;text-decoration:none;">+852 9832 5789</a>
      </p>
    </div>`;

  const html = wrapEmail(emailHeader("#16a34a", "✓ ORDER CONFIRMED"), body);
  return { subject, html };
}

// ─── Template: ACTIVE ─────────────────────────────────────────────────────────

function buildActiveEmail(data: OrderStatusEmailData): { subject: string; html: string } {
  const subject = `EquipHK — Order #${data.orderId} is Now Active 🚀`;
  const itemsHtml = data.itemNames
    .map((n) => `<li style="padding:4px 0;color:#374151;">${n}</li>`)
    .join("");

  const returnAddress = data.returnAddress ?? "our depot — contact us for the address";
  const collectionSlotHtml =
    data.collectionSlotDate
      ? `<tr>
           <td style="color:#6b7280;font-size:13px;padding-bottom:6px;">Collection Slot</td>
           <td style="color:#0a0e1a;font-weight:600;text-align:right;padding-bottom:6px;">
             ${formatDate(data.collectionSlotDate)} — ${data.collectionSlotTime ?? ""}
           </td>
         </tr>`
      : "";

  const body = `
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Order Reference</p>
    <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;color:#0a0e1a;">Order #${data.orderId} — Active</h1>

    <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
      Hi <strong>${data.customerName}</strong>,<br>
      Your rental is now <strong>active</strong>.
      ${data.deliveryType === "delivery"
        ? "Your equipment is on its way to you."
        : "Your equipment is ready for collection at our depot."
      }
    </p>

    <!-- Equipment -->
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#0a0e1a;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Equipment on Hire</p>
      <ul style="margin:0;padding-left:20px;">${itemsHtml}</ul>
    </div>

    <!-- Return deadline — CRITICAL -->
    <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:900;color:#92400e;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">⚠️ Return Deadline</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#78350f;font-size:13px;padding-bottom:6px;">Return By</td>
          <td style="color:#92400e;font-weight:700;text-align:right;padding-bottom:6px;">15:00 HKT on ${formatDate(data.rentalEndDate)}</td>
        </tr>
        <tr>
          <td style="color:#78350f;font-size:13px;padding-bottom:6px;">Return To</td>
          <td style="color:#92400e;font-weight:700;text-align:right;padding-bottom:6px;">${returnAddress}</td>
        </tr>
        ${collectionSlotHtml}
      </table>
      <p style="margin:12px 0 0;color:#92400e;font-size:12px;">
        Late returns are charged at the full published daily rate with all discounts voided, per our Terms & Conditions.
      </p>
    </div>

    <!-- Support -->
    <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
      <p style="margin:0;color:#374151;font-size:14px;">Need assistance during your hire?</p>
      <p style="margin:8px 0 0;color:#374151;font-size:14px;">
        📧 <a href="mailto:Bookings@Equip.hk" style="color:#f97316;text-decoration:none;">Bookings@Equip.hk</a>&nbsp;&nbsp;
        📞 <a href="tel:+85298325789" style="color:#f97316;text-decoration:none;">+852 9832 5789</a>
      </p>
    </div>`;

  const html = wrapEmail(emailHeader("#2563eb", "🚀 HIRE ACTIVE"), body);
  return { subject, html };
}

// ─── Template: COMPLETED ──────────────────────────────────────────────────────

function buildCompletedEmail(data: OrderStatusEmailData): { subject: string; html: string } {
  const subject = `EquipHK — Order #${data.orderId} Complete — Thank You!`;
  const itemsHtml = data.itemNames
    .map((n) => `<li style="padding:4px 0;color:#374151;">${n}</li>`)
    .join("");

  const body = `
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Order Reference</p>
    <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;color:#0a0e1a;">Order #${data.orderId} — Complete</h1>

    <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
      Hi <strong>${data.customerName}</strong>,<br>
      Your rental has been <strong>completed</strong>. Thank you for choosing EquipHK — we hope the equipment served you well on site.
    </p>

    <!-- Equipment summary -->
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#0a0e1a;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Equipment Returned</p>
      <ul style="margin:0;padding-left:20px;">${itemsHtml}</ul>
      <p style="margin:12px 0 0;color:#6b7280;font-size:13px;">
        Hire period: ${formatDate(data.rentalStartDate)} – ${formatDate(data.rentalEndDate)} (${data.rentalDays} day${data.rentalDays !== 1 ? "s" : ""})
      </p>
    </div>

    <!-- CTA: Book again -->
    <div style="background:#0a0e1a;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;color:#ffffff;font-size:16px;font-weight:700;">Need equipment again?</p>
      <p style="margin:0 0 16px;color:#9ca3af;font-size:14px;">Browse our full catalogue — 300+ items available for same-day hire.</p>
      <a href="${SITE_URL}/equipment" style="background-color:#f97316;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
        Browse Equipment →
      </a>
    </div>

    <!-- Trade Pro upsell (only for PAYG) -->
    ${data.membershipPlan !== "trade_pro" ? `
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:14px;">Save more on your next hire</p>
      <p style="margin:0 0 12px;color:#78350f;font-size:13px;line-height:1.5;">
        Trade Pro members save up to 15% on every hire, get priority booking, and have their security deposit waived. 
        If you hire regularly, it pays for itself quickly.
      </p>
      <a href="${SITE_URL}/membership" style="background-color:#f59e0b;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;display:inline-block;">
        Explore Trade Pro →
      </a>
    </div>` : ""}

    <!-- Support -->
    <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
      <p style="margin:0;color:#374151;font-size:14px;">Any questions about your completed hire?</p>
      <p style="margin:8px 0 0;color:#374151;font-size:14px;">
        📧 <a href="mailto:Bookings@Equip.hk" style="color:#f97316;text-decoration:none;">Bookings@Equip.hk</a>&nbsp;&nbsp;
        📞 <a href="tel:+85298325789" style="color:#f97316;text-decoration:none;">+852 9832 5789</a>
      </p>
    </div>`;

  const html = wrapEmail(emailHeader("#7c3aed", "✅ HIRE COMPLETE"), body);
  return { subject, html };
}

// ─── Template: CANCELLED ─────────────────────────────────────────────────────

function buildCancelledEmail(data: OrderStatusEmailData): { subject: string; html: string } {
  const subject = `EquipHK — Order #${data.orderId} Cancelled`;

  const body = `
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Order Reference</p>
    <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;color:#0a0e1a;">Order #${data.orderId} — Cancelled</h1>

    <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
      Hi <strong>${data.customerName}</strong>,<br>
      Your rental order has been <strong>cancelled</strong>. If you believe this is an error or have any questions, please contact us immediately.
    </p>

    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#991b1b;font-size:14px;">Refund Information</p>
      <p style="margin:0;color:#7f1d1d;font-size:13px;line-height:1.5;">
        If a payment was made, a refund will be processed to your original payment method within 5–10 business days, in accordance with our refund policy.
      </p>
    </div>

    <!-- Support -->
    <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
      <p style="margin:0;color:#374151;font-size:14px;">Need to rebook or have questions?</p>
      <p style="margin:8px 0 0;color:#374151;font-size:14px;">
        📧 <a href="mailto:Bookings@Equip.hk" style="color:#f97316;text-decoration:none;">Bookings@Equip.hk</a>&nbsp;&nbsp;
        📞 <a href="tel:+85298325789" style="color:#f97316;text-decoration:none;">+852 9832 5789</a>
      </p>
    </div>`;

  const html = wrapEmail(emailHeader("#dc2626", "✕ ORDER CANCELLED"), body);
  return { subject, html };
}

// ─── Main send function ───────────────────────────────────────────────────────

export type OrderEmailStatus = "confirmed" | "active" | "completed" | "cancelled";

/**
 * Send an order status notification email to the customer.
 * Returns { subject, success, error? }
 */
export async function sendOrderStatusEmail(
  status: OrderEmailStatus,
  data: OrderStatusEmailData
): Promise<{ subject: string; success: boolean; error?: string }> {
  let template: { subject: string; html: string };

  switch (status) {
    case "confirmed":
      template = buildConfirmedEmail(data);
      break;
    case "active":
      template = buildActiveEmail(data);
      break;
    case "completed":
      template = buildCompletedEmail(data);
      break;
    case "cancelled":
      template = buildCancelledEmail(data);
      break;
    default:
      return { subject: "", success: false, error: `Unknown status: ${status}` };
  }

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      bcc: ADMIN_EMAIL,
      subject: template.subject,
      html: template.html,
    });
    console.log(`[OrderEmail] Sent '${status}' email to ${data.customerEmail} for Order #${data.orderId}`);
    return { subject: template.subject, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[OrderEmail] Failed to send '${status}' email for Order #${data.orderId}:`, msg);
    return { subject: template.subject, success: false, error: msg };
  }
}


// ─── Return Charge Email ──────────────────────────────────────────────────────

export interface ReturnChargeEmailData {
  orderId: number;
  customerEmail: string;
  customerName: string;
  orderItems: Array<{ equipmentName: string; rentalDays: number }>;
  condition: string;
  overallNotes?: string;
  charges: Array<{ chargeType: string; description: string; amount: number; photoUrls?: string[] }>;
  totalCharges: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
}

function buildReturnChargeEmail(data: ReturnChargeEmailData): { subject: string; html: string } {
  const hasCharges = data.charges.length > 0 && data.totalCharges > 0;
  const subject = hasCharges
    ? `EquipHK — Order #${data.orderId} Returned — Additional Charges Apply`
    : `EquipHK — Order #${data.orderId} Equipment Returned — Thank You`;

  const conditionLabel: Record<string, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    damaged: "Damaged",
    missing_items: "Missing Items",
  };

  const chargeTypeLabel: Record<string, string> = {
    damage: "Damage",
    repair: "Repair",
    cleaning: "Cleaning",
    missing_item: "Missing Item",
    other: "Other",
  };

  const chargeRows = data.charges
    .map(
      c => {
        const photoHtml = c.photoUrls && c.photoUrls.length > 0
          ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">${c.photoUrls.map(url =>
              `<a href="${url}" target="_blank" style="display:inline-block;">
                <img src="${url}" alt="Damage evidence" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #fca5a5;" />
              </a>`
            ).join("")}</div>`
          : "";
        return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;margin-right:8px;">${chargeTypeLabel[c.chargeType] ?? c.chargeType}</span>
        ${c.description}
        ${photoHtml}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:right;font-weight:600;vertical-align:top;">${formatHKD(c.amount)}</td>
    </tr>`;
      }
    )
    .join("");

  const itemRows = data.orderItems
    .map(
      i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;">${i.equipmentName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;text-align:right;">${i.rentalDays} day${i.rentalDays !== 1 ? "s" : ""}</td>
    </tr>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Equipment Return</p>
    <h1 style="margin:0 0 24px;font-size:28px;font-weight:900;color:#0a0e1a;">Order #${data.orderId} — Returned</h1>
    <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
      Hi <strong>${data.customerName}</strong>,<br>
      Your equipment has been received and inspected by our warehouse team.
      ${hasCharges ? "Additional charges have been identified and are detailed below." : "Everything looks great — no additional charges apply."}
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Equipment Condition</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#0a0e1a;">${conditionLabel[data.condition] ?? data.condition}</p>
      ${data.overallNotes ? `<p style="margin:8px 0 0;font-size:13px;color:#374151;line-height:1.5;">${data.overallNotes}</p>` : ""}
    </div>
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0a0e1a;">Items Returned</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Equipment</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Duration</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    ${
      hasCharges
        ? `<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#dc2626;">Additional Charges</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fca5a5;border-radius:8px;overflow:hidden;margin-bottom:16px;">
      <thead>
        <tr style="background:#fef2f2;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#991b1b;">Description</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#991b1b;">Amount</th>
        </tr>
      </thead>
      <tbody>${chargeRows}</tbody>
      <tfoot>
        <tr style="background:#fef2f2;">
          <td style="padding:12px;font-weight:900;font-size:15px;color:#991b1b;">Total Additional Charges</td>
          <td style="padding:12px;font-weight:900;font-size:15px;color:#991b1b;text-align:right;">${formatHKD(data.totalCharges)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#7f1d1d;font-size:13px;line-height:1.5;">
        These charges will be applied to your account or payment method on file. If you have any questions, please contact us within 48 hours.
      </p>
    </div>`
        : `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#14532d;font-size:14px;font-weight:600;">No additional charges — thank you for returning the equipment in good condition!</p>
    </div>`
    }
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}" style="display:inline-block;padding:14px 32px;background:#f97316;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:6px;">Browse Equipment Again</a>
    </div>
    <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
      <p style="margin:0;color:#374151;font-size:14px;">Questions about your return or charges?</p>
      <p style="margin:8px 0 0;color:#374151;font-size:14px;">
        📧 <a href="mailto:Bookings@Equip.hk" style="color:#f97316;text-decoration:none;">Bookings@Equip.hk</a>&nbsp;&nbsp;
        📞 <a href="tel:+85298325789" style="color:#f97316;text-decoration:none;">+852 9832 5789</a>
      </p>
    </div>`;

  const headerColor = hasCharges ? "#dc2626" : "#16a34a";
  const headerText = hasCharges ? "⚠ RETURN — CHARGES APPLY" : "✓ EQUIPMENT RETURNED";
  const html = wrapEmail(emailHeader(headerColor, headerText), body);
  return { subject, html };
}

export async function sendReturnChargeEmail(
  data: ReturnChargeEmailData
): Promise<{ subject: string; success: boolean; error?: string }> {
  const template = buildReturnChargeEmail(data);
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      bcc: ADMIN_EMAIL,
      subject: template.subject,
      html: template.html,
    });
    console.log(`[ReturnEmail] Sent return charge email to ${data.customerEmail} for Order #${data.orderId}`);
    return { subject: template.subject, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ReturnEmail] Failed to send return charge email for Order #${data.orderId}:`, msg);
    return { subject: template.subject, success: false, error: msg };
  }
}

// ─── Warehouse Alert Email ────────────────────────────────────────────────────

export async function sendWarehouseAlertEmail(
  status: "confirmed" | "active",
  data: {
    orderId: number;
    customerName: string;
    customerPhone?: string;
    orderItems: Array<{ equipmentName: string; rentalDays: number }>;
    rentalStartDate?: string;
    rentalEndDate?: string;
    deliveryType?: string;
    deliveryAddress?: string;
    deliverySlotDate?: string;
    deliverySlotTime?: string;
    collectionSlotDate?: string;
    collectionSlotTime?: string;
  }
): Promise<void> {
  const WAREHOUSE_EMAIL = process.env.WAREHOUSE_EMAIL ?? "warehouse@equip.hk";

  const itemList = data.orderItems
    .map(i => `<li style="padding:4px 0;color:#374151;font-size:14px;">${i.equipmentName} — ${i.rentalDays} day${i.rentalDays !== 1 ? "s" : ""}</li>`)
    .join("");

  let subject: string;
  let actionBox: string;

  if (status === "confirmed") {
    subject = `[PREP REQUIRED] Order #${data.orderId} — ${data.customerName}`;
    actionBox = `
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-weight:700;color:#92400e;font-size:14px;">ACTION: Prepare equipment for dispatch</p>
        <p style="margin:0;color:#78350f;font-size:13px;line-height:1.5;">
          This order has been confirmed. Please locate, inspect, and prepare the items below for dispatch on the scheduled date.
        </p>
      </div>`;
  } else {
    subject = `[DISPATCHED — EXPECT RETURN] Order #${data.orderId} — ${data.customerName}`;
    actionBox = `
      <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-weight:700;color:#1e40af;font-size:14px;">INFO: Equipment dispatched — expect return</p>
        <p style="margin:0;color:#1e3a8a;font-size:13px;line-height:1.5;">
          This order is now active. Equipment has been dispatched. Please monitor the return date and be ready to receive and inspect on collection.
        </p>
      </div>`;
  }

  const body = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:900;color:#0a0e1a;">Order #${data.orderId}</h1>
    ${actionBox}
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-weight:700;color:#0a0e1a;font-size:14px;">Customer Details</p>
      <p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Name:</strong> ${data.customerName}</p>
      ${data.customerPhone ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Phone:</strong> ${data.customerPhone}</p>` : ""}
      ${data.rentalStartDate ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Rental Start:</strong> ${data.rentalStartDate}</p>` : ""}
      ${data.rentalEndDate ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Rental End:</strong> ${data.rentalEndDate}</p>` : ""}
      ${data.deliveryType ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Delivery Type:</strong> ${data.deliveryType}</p>` : ""}
      ${data.deliveryAddress ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Address:</strong> ${data.deliveryAddress}</p>` : ""}
      ${data.deliverySlotDate ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Delivery Slot:</strong> ${data.deliverySlotDate} ${data.deliverySlotTime ?? ""}</p>` : ""}
      ${data.collectionSlotDate ? `<p style="margin:4px 0;color:#374151;font-size:13px;"><strong>Collection Slot:</strong> ${data.collectionSlotDate} ${data.collectionSlotTime ?? ""}</p>` : ""}
    </div>
    <h2 style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0a0e1a;">Equipment List</h2>
    <ul style="margin:0 0 24px;padding-left:20px;">${itemList}</ul>
    <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
      <p style="margin:0;color:#6b7280;font-size:12px;">This is an automated alert from the EquipHK order management system.</p>
    </div>`;

  const headerColor = status === "confirmed" ? "#f59e0b" : "#3b82f6";
  const headerText = status === "confirmed" ? "⚙ PREP REQUIRED" : "🚚 DISPATCHED";
  const html = wrapEmail(emailHeader(headerColor, headerText), body);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: WAREHOUSE_EMAIL,
      subject,
      html,
    });
    console.log(`[WarehouseAlert] Sent '${status}' alert for Order #${data.orderId} to ${WAREHOUSE_EMAIL}`);
  } catch (err) {
    console.error(`[WarehouseAlert] Failed to send alert for Order #${data.orderId}:`, err);
  }
}
