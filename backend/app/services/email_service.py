"""
ThreatCast - Secure Email & OTP Dispatch Service
Handles TLS-encrypted SMTP email dispatch for account verification and MFA.
Includes a graceful fallback logger for local development and offline environments.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from backend.app.core.config import settings

logger = logging.getLogger("threatcast.email")


def generate_otp_email_html(user_name: str, otp_code: str, expire_minutes: int) -> str:
    """Generates an enterprise-styled HTML email for OTP verification."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ThreatCast Security Clearance Verification</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 580px; margin: 40px auto; background-color: #0f172a; border: 1px solid rgba(6, 182, 212, 0.4); border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; }}
        .header h1 {{ color: #06b6d4; font-size: 22px; letter-spacing: 2px; margin: 0; font-family: monospace; }}
        .badge {{ display: inline-block; background: #164e63; color: #67e8f9; font-size: 11px; padding: 3px 8px; border-radius: 4px; border: 1px solid #0891b2; margin-top: 6px; font-family: monospace; }}
        .content {{ padding: 24px 0; }}
        .otp-box {{ background: #020617; border: 2px dashed #06b6d4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #22d3ee; font-family: monospace; }}
        .details {{ color: #94a3b8; font-size: 13px; line-height: 1.6; }}
        .footer {{ border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; font-family: monospace; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>THREATCAST DEFENSE PLATFORM</h1>
          <div class="badge">SECURE OPERATOR CLEARANCE VERIFICATION</div>
        </div>
        <div class="content">
          <p>Hello <strong>{user_name}</strong>,</p>
          <p class="details">
            An account registration or authentication request was initiated for your ThreatCast Security Operations Center (SOC) clearance.
            Use the one-time verification passcode (OTP) below to authenticate and activate your account.
          </p>
          <div class="otp-box">
            <div class="otp-code">{otp_code}</div>
          </div>
          <p class="details">
            This verification code is valid for <strong>{expire_minutes} minutes</strong>. 
            If you did not initiate this request, please contact your Lead SOC Administrator immediately.
          </p>
        </div>
        <div class="footer">
          ThreatCast Predictive Cyber Defence System &middot; Automated Security Dispatcher &middot; Confidential
        </div>
      </div>
    </body>
    </html>
    """


def _send_via_resend(to_email: str, subject: str, html_content: str) -> bool:
    """Dispatches email via Resend transactional HTTPS API."""
    try:
        import httpx
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        sender = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        payload = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                logger.info(f"Successfully dispatched OTP to {to_email} via Resend API.")
                return True
            else:
                logger.warning(f"Resend API error (HTTP {resp.status_code}): {resp.text}")
    except Exception as e:
        logger.warning(f"Failed to dispatch via Resend API: {e}")
    return False


def _send_via_sendgrid(to_email: str, subject: str, plain_content: str, html_content: str) -> bool:
    """Dispatches email via SendGrid v3 Mail Send API."""
    try:
        import httpx
        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": settings.SMTP_FROM_EMAIL, "name": settings.SMTP_FROM_NAME},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": plain_content},
                {"type": "text/html", "value": html_content}
            ]
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 202):
                logger.info(f"Successfully dispatched OTP to {to_email} via SendGrid API.")
                return True
            else:
                logger.warning(f"SendGrid API error (HTTP {resp.status_code}): {resp.text}")
    except Exception as e:
        logger.warning(f"Failed to dispatch via SendGrid API: {e}")
    return False


def _send_via_brevo(to_email: str, subject: str, html_content: str) -> bool:
    """Dispatches email via Brevo (Sendinblue) transactional API."""
    try:
        import httpx
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "sender": {"name": settings.SMTP_FROM_NAME, "email": settings.SMTP_FROM_EMAIL},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                logger.info(f"Successfully dispatched OTP to {to_email} via Brevo API.")
                return True
            else:
                logger.warning(f"Brevo API error (HTTP {resp.status_code}): {resp.text}")
    except Exception as e:
        logger.warning(f"Failed to dispatch via Brevo API: {e}")
    return False


def _send_via_smtp(to_email: str, subject: str, plain_content: str, html_content: str) -> bool:
    """Dispatches email via standard SMTP socket with TLS/SSL."""
    try:
        from_email = settings.SMTP_FROM_EMAIL
        if not from_email or "auth@threatcast.soc" in from_email or "gmail" in (settings.SMTP_HOST or "").lower():
            from_email = settings.SMTP_USER or settings.SMTP_FROM_EMAIL
        from_name = settings.SMTP_FROM_NAME or "ThreatCast SOC Security"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email

        part1 = MIMEText(plain_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            server.ehlo()
            if settings.SMTP_PORT in (587, 25):
                server.starttls()
                server.ehlo()

        smtp_user = settings.SMTP_USER.strip()
        smtp_password = (settings.SMTP_PASSWORD or "").strip().replace(" ", "")

        with server:
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())

        logger.info(f"Successfully dispatched verification OTP to {to_email} via SMTP ({settings.SMTP_HOST}).")
        return True
    except Exception as e:
        logger.warning(f"Failed to dispatch email via SMTP ({e}).")
        return False


def send_otp_email(to_email: str, otp_code: str, user_name: str = "Operator") -> bool:
    """
    Dispatches the OTP email across configured providers in priority order:
    1. Resend API (HTTPS)
    2. SendGrid API (HTTPS)
    3. Brevo API (HTTPS)
    4. SMTP TLS / SSL Socket
    5. Local / Development Console Fallback
    """
    subject = f"[ThreatCast] Your Security Verification Code is {otp_code}"
    html_content = generate_otp_email_html(user_name, otp_code, settings.OTP_EXPIRE_MINUTES)
    plain_content = (
        f"ThreatCast Security Verification\n\n"
        f"Hello {user_name},\n\n"
        f"Your one-time verification code (OTP) is: {otp_code}\n\n"
        f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
    )

    # 1. Resend API
    if settings.RESEND_API_KEY:
        if _send_via_resend(to_email, subject, html_content):
            return True

    # 2. SendGrid API
    if settings.SENDGRID_API_KEY:
        if _send_via_sendgrid(to_email, subject, plain_content, html_content):
            return True

    # 3. Brevo API
    if settings.BREVO_API_KEY:
        if _send_via_brevo(to_email, subject, html_content):
            return True

    # 4. Standard SMTP (Gmail, Outlook, Amazon SES, Mailgun, etc.)
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        if _send_via_smtp(to_email, subject, plain_content, html_content):
            return True

    # 5. Local / Development Fallback Simulator
    print("\n" + "=" * 65)
    print(" 📨 [THREATCAST EMAIL DISPATCH SIMULATOR]")
    print(f" To:       {to_email}")
    print(f" Subject:  {subject}")
    print(f" Code:     >>> [ {otp_code} ] <<< (Expires in {settings.OTP_EXPIRE_MINUTES} mins)")
    print("=" * 65 + "\n")
    return True
