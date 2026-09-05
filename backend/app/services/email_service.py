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


def send_otp_email(to_email: str, otp_code: str, user_name: str = "Operator") -> bool:
    """
    Dispatches the OTP email.
    If SMTP is configured, sends via smtplib with TLS.
    If SMTP is not configured or fails, logs to console with visual banner for easy local testing.
    """
    subject = f"[ThreatCast] Your Security Verification Code is {otp_code}"
    html_content = generate_otp_email_html(user_name, otp_code, settings.OTP_EXPIRE_MINUTES)
    plain_content = (
        f"ThreatCast Security Verification\n\n"
        f"Hello {user_name},\n\n"
        f"Your one-time verification code (OTP) is: {otp_code}\n\n"
        f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
    )

    # Check if SMTP is configured
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
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

            with server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

            logger.info(f"Successfully dispatched verification OTP to {to_email} via SMTP.")
            return True
        except Exception as e:
            logger.warning(f"Failed to dispatch email via SMTP ({e}). Falling back to local console dispatch.")

    # Local / Development Fallback Logger
    print("\n" + "=" * 65)
    print(" 📨 [THREATCAST EMAIL DISPATCH SIMULATOR]")
    print(f" To:       {to_email}")
    print(f" Subject:  {subject}")
    print(f" Code:     >>> [ {otp_code} ] <<< (Expires in {settings.OTP_EXPIRE_MINUTES} mins)")
    print("=" * 65 + "\n")
    return True
