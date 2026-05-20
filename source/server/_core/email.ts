/**
 * Customer email helper using Resend
 * Used for transactional emails: booking confirmations, membership confirmations
 */
import { Resend } from "resend";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY ?? "";
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "EquipHK <noreply@equip.hk>";
const ADMIN_EMAIL = "Bookings@Equip.hk";

export interface BookingConfirmationData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string | null;
  membershipPlan: string;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalDays: number;
  subtotal: string;
  discountPercent: string;
  discountAmount: string;
  deliveryFee: string;
  depositAmount: string;
  depositWaived: boolean;
  totalAmount: string;
  deliveryType: string;
  deliveryAddress?: string | null;
  returnAddress: string;
  itemNames: string[];
}

function formatHKD(val: string | number): string {
  return `HK$${Number(val).toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-HK", { day: "numeric", month: "long", year: "numeric" });
}

export async function sendBookingConfirmationEmail(data: BookingConfirmationData): Promise<void> {
  const resend = getResend();

  const planLabel = data.membershipPlan === "trade_pro" ? "Trade Pro" : "Pay-As-You-Go";
  const itemsHtml = data.itemNames.map((name) => `<li style="padding: 4px 0; color: #374151;">${name}</li>`).join("");
  const discountRow = Number(data.discountAmount) > 0
    ? `<tr><td style="padding: 6px 0; color: #374151;">Discount (${data.discountPercent}% Trade Pro)</td><td style="padding: 6px 0; color: #16a34a; text-align: right;">−${formatHKD(data.discountAmount)}</td></tr>`
    : "";
  const depositRow = data.depositWaived
    ? `<tr><td style="padding: 6px 0; color: #374151;">Security Deposit</td><td style="padding: 6px 0; color: #2563eb; text-align: right;">Waived (Trade Pro)</td></tr>`
    : `<tr><td style="padding: 6px 0; color: #374151;">Refundable Security Deposit</td><td style="padding: 6px 0; color: #374151; text-align: right;">${formatHKD(data.depositAmount)}</td></tr>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        
        <!-- Header -->
        <tr>
          <td style="background-color: #0a0e1a; padding: 32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">EQUIP<span style="color: #f97316;">HK</span></span>
                  <p style="margin: 4px 0 0; color: #9ca3af; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Rent Anything. Build Everything.</p>
                </td>
                <td align="right">
                  <span style="background-color: #16a34a; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700;">✓ BOOKING CONFIRMED</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
            <h1 style="margin: 0 0 24px; font-size: 32px; font-weight: 900; color: #0a0e1a;">Order #${data.orderId}</h1>
            
            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
              Hi <strong>${data.customerName}</strong>,<br>
              Your equipment rental has been confirmed and payment received. Here's a summary of your booking.
            </p>

            <!-- Items -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-weight: 700; color: #0a0e1a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Equipment Rented</p>
              <ul style="margin: 0; padding-left: 20px;">
                ${itemsHtml}
              </ul>
            </div>

            <!-- Rental Period -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-weight: 700; color: #0a0e1a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Rental Period</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #6b7280; font-size: 13px; padding-bottom: 6px;">Start Date</td>
                  <td style="color: #0a0e1a; font-weight: 600; text-align: right; padding-bottom: 6px;">${formatDate(data.rentalStartDate)}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 13px; padding-bottom: 6px;">End Date</td>
                  <td style="color: #0a0e1a; font-weight: 600; text-align: right; padding-bottom: 6px;">${formatDate(data.rentalEndDate)}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 13px;">Duration</td>
                  <td style="color: #0a0e1a; font-weight: 600; text-align: right;">${data.rentalDays} day${data.rentalDays !== 1 ? "s" : ""}</td>
                </tr>
              </table>
            </div>

            <!-- Pricing -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-weight: 700; color: #0a0e1a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Payment Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding: 6px 0; color: #374151;">Subtotal</td><td style="padding: 6px 0; color: #374151; text-align: right;">${formatHKD(data.subtotal)}</td></tr>
                ${discountRow}
                <tr><td style="padding: 6px 0; color: #374151;">Delivery Fee</td><td style="padding: 6px 0; color: #374151; text-align: right;">${Number(data.deliveryFee) === 0 ? "Free" : formatHKD(data.deliveryFee)}</td></tr>
                ${depositRow}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0 6px; font-weight: 900; color: #0a0e1a; font-size: 16px;">Total Paid</td>
                  <td style="padding: 12px 0 6px; font-weight: 900; color: #f97316; font-size: 18px; text-align: right;">${formatHKD(data.totalAmount)}</td>
                </tr>
              </table>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">Membership: ${planLabel}</p>
            </div>

            <!-- Delivery / Collection -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-weight: 700; color: #0a0e1a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${data.deliveryType === "delivery" ? "Delivery Details" : "Self-Collection"}</p>
              ${data.deliveryType === "delivery" && data.deliveryAddress
                ? `<p style="margin: 0; color: #374151;">${data.deliveryAddress}</p>`
                : `
                  <p style="margin: 0 0 8px; color: #374151; font-weight: 600;">1-12 Shing Fung Industrial Park, 1 Hon Kin Road, Sai Kung, Hong Kong</p>
                  <p style="margin: 0 0 6px; color: #6b7280; font-size: 13px;">🕐 Opening Hours: Mon–Sat, 09:00 – 18:00</p>
                  <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">📋 Please bring this confirmation email and a valid photo ID.</p>
                  <a href="https://maps.google.com/?q=1-12+Shing+Fung+Industrial+Park,+1+Hon+Kin+Road,+Sai+Kung,+Hong+Kong" style="color: #f97316; font-size: 13px; text-decoration: none;">→ Get Directions on Google Maps</a>
                `
              }
            </div>

            <!-- Return Deadline — CRITICAL -->
            <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-weight: 900; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Important — Return Deadline</p>
              <p style="margin: 0 0 8px; color: #78350f; font-size: 15px; line-height: 1.6;">
                All equipment must be returned to <strong>${data.returnAddress}</strong> by <strong>15:00 HKT on ${formatDate(data.rentalEndDate)}</strong>.
              </p>
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                Late returns will be charged at the full published daily rate per day, with all discounts voided, in accordance with our Terms & Conditions.
              </p>
            </div>

            <!-- Support -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 8px;">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px;">Need help? Contact us:</p>
              <p style="margin: 0; color: #374151; font-size: 14px;">
                📧 <a href="mailto:Bookings@Equip.hk" style="color: #f97316; text-decoration: none;">Bookings@Equip.hk</a><br>
                📞 <a href="tel:+85298325789" style="color: #f97316; text-decoration: none;">+852 9832 5789</a>
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #0a0e1a; padding: 24px 40px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              EquipHK — Kowloon Construction Company Limited<br>
              This is an automated confirmation. Please retain for your records.<br>
              <a href="https://www.equip.hk/terms" style="color: #f97316; text-decoration: none;">Terms & Conditions</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    bcc: ADMIN_EMAIL,
    subject: `EquipHK — Booking Confirmed #${data.orderId}`,
    html,
  });

  console.log(`[Email] Confirmation sent to ${data.customerEmail} for Order #${data.orderId}`);
}

// ─── Admin: Expiring Deposit Hold Reminder ────────────────────────────────────

export interface ExpiringHoldOrder {
  id: number;
  customerName: string;
  customerEmail: string;
  depositAmount: string;
  depositHoldExpiresAt: Date | string;
  rentalEndDate: Date | string;
}

export async function sendDepositHoldExpiryReminderEmail(orders: ExpiringHoldOrder[]): Promise<void> {
  if (orders.length === 0) return;
  const resend = getResend();

  const rowsHtml = orders.map((o) => {
    const expDate = new Date(o.depositHoldExpiresAt);
    const msLeft = expDate.getTime() - Date.now();
    const hoursLeft = Math.round(msLeft / (60 * 60 * 1000));
    const urgencyColor = hoursLeft <= 24 ? "#dc2626" : "#f97316";
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 8px; font-weight: bold; color: #111827;">#${o.id}</td>
        <td style="padding: 10px 8px; color: #374151;">${o.customerName}</td>
        <td style="padding: 10px 8px; color: #374151;">HK$${Number(o.depositAmount).toLocaleString()}</td>
        <td style="padding: 10px 8px; font-weight: bold; color: ${urgencyColor};">${expDate.toLocaleDateString("en-HK", { day: "numeric", month: "short" })} (${hoursLeft}h left)</td>
        <td style="padding: 10px 8px;">
          <a href="https://www.equip.hk/admin/orders" style="background: #f97316; color: white; padding: 4px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold;">Manage</a>
        </td>
      </tr>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0a0e1a;padding:28px 40px;">
            <p style="margin:0;color:#f97316;font-size:22px;font-weight:900;letter-spacing:-0.5px;">EQUIPHK</p>
            <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Admin Alert — Card Hold Expiry</p>
          </td>
        </tr>

        <!-- Alert Body -->
        <tr>
          <td style="padding:32px 40px;">
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;color:#dc2626;font-weight:700;font-size:15px;">
                ⚠️ ${orders.length} card hold${orders.length > 1 ? "s" : ""} expiring within 48 hours
              </p>
              <p style="margin:6px 0 0;color:#7f1d1d;font-size:13px;">
                Review each order and either release the hold (equipment returned OK) or capture the deposit (damage/loss) before the hold lapses.
              </p>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 8px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Order</th>
                  <th style="padding:10px 8px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Customer</th>
                  <th style="padding:10px 8px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Hold Amount</th>
                  <th style="padding:10px 8px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Expires</th>
                  <th style="padding:10px 8px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Action</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>

            <div style="margin-top:24px;text-align:center;">
              <a href="https://www.equip.hk/admin/orders" style="background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                Open Admin Orders Panel →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0a0e1a;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:12px;">
              EquipHK — Automated Admin Alert<br>
              This reminder is sent daily when card holds are due to expire within 48 hours.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `⚠️ EquipHK — ${orders.length} Card Hold${orders.length > 1 ? "s" : ""} Expiring Soon`,
    html,
  });

  console.log(`[Email] Deposit hold expiry reminder sent for ${orders.length} order(s)`);
}

// ─── Customer: Deposit Hold Released Notification ─────────────────────────────

export interface DepositReleasedData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  depositAmount: string;
}

export async function sendDepositReleasedEmail(data: DepositReleasedData): Promise<void> {
  const resend = getResend();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#16a34a;padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">✓ DEPOSIT HOLD RELEASED</p>
            <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">EquipHK — Order #${data.orderId}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#0a0e1a;">Your deposit hold has been released</h1>
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
              Hi <strong>${data.customerName}</strong>,<br>
              Great news — your equipment was returned in good condition and we have released your security deposit hold of <strong>HK$${Number(data.depositAmount).toLocaleString()}</strong>.
            </p>

            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#15803d;font-weight:700;">What happens next</p>
              <p style="margin:0;color:#14532d;font-size:14px;line-height:1.7;">
                The hold of <strong>HK$${Number(data.depositAmount).toLocaleString()}</strong> has been cancelled on our end.
                Your bank will clear the pending amount within <strong>3–5 business days</strong>, depending on your card issuer.
                No money was ever charged — the hold simply disappears from your statement.
              </p>
            </div>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Order Reference</p>
              <p style="margin:0;font-size:18px;font-weight:900;color:#0a0e1a;">#${data.orderId}</p>
            </div>

            <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
              Thank you for renting with EquipHK. We look forward to serving you again on your next project.
            </p>

            <div style="text-align:center;margin-bottom:24px;">
              <a href="https://www.equip.hk/equipment" style="display:inline-block;padding:14px 32px;background:#f97316;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Browse Equipment Again →</a>
            </div>

            <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
              <p style="margin:0 0 6px;color:#374151;font-size:13px;">Questions? We're here to help:</p>
              <p style="margin:0;color:#374151;font-size:13px;">
                📧 <a href="mailto:Bookings@Equip.hk" style="color:#f97316;text-decoration:none;">Bookings@Equip.hk</a>&nbsp;&nbsp;
                📞 <a href="tel:+85298325789" style="color:#f97316;text-decoration:none;">+852 9832 5789</a>
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0a0e1a;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:12px;">
              EquipHK — Kowloon Construction Company Limited<br>
              <a href="https://www.equip.hk/terms" style="color:#f97316;text-decoration:none;">Terms & Conditions</a> &nbsp;·&nbsp;
              <a href="https://www.equip.hk/deposit-info" style="color:#f97316;text-decoration:none;">About Card Holds</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `EquipHK — Your deposit hold has been released (Order #${data.orderId})`,
    html,
  });

  console.log(`[Email] Deposit release notification sent to ${data.customerEmail} for Order #${data.orderId}`);
}
