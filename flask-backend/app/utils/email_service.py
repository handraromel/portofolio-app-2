import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app, url_for
from urllib.parse import urljoin


class EmailService:
    def __init__(self):
        self.sender_email = os.environ.get('EMAIL_USER')
        self.sender_password = os.environ.get('EMAIL_PASSWORD')
        self.email_service = os.environ.get('EMAIL_SERVICE')
        self.email_port = int(os.environ.get('EMAIL_PORT'))

    def send_email(self, receiver_email, subject, text_content, html_content):
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.sender_email
        message["To"] = receiver_email

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        message.attach(part1)
        message.attach(part2)

        try:
            with smtplib.SMTP(self.email_service, self.email_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email,
                                receiver_email, message.as_string())
            return True
        except Exception as e:
            current_app.logger.error(f"Failed to send email: {str(e)}")
            return False


email_service = EmailService()


def send_forgot_password_email(user, new_password):
    subject = "Your New Password"

    text_content = f"""
    Hello {user.username},
    
    Please use the following password to log into your account:
    {new_password}
    """

    html_content = f"""
    <html>
    <body>
        <p>Hello {user.username},</p>
        <p>Please use the following password to log into your account:</p>
        <p>{new_password}</p>
    </body>
    </html>
    """

    return email_service.send_email(user.email, subject, text_content, html_content)


def send_activation_email(user):
    origins_url = os.environ.get('ORIGINS_URL')

    activation_link = f"{origins_url}/activate-account/{user.verification_token}"

    subject = "Activate Your Account"

    text_content = f"""
    Hello {user.username},
    
    Please click on the following link to activate your account:
    {activation_link}
    
    If you did not create an account, please ignore this email.
    """

    html_content = f"""
    <html>
    <body>
        <p>Hello {user.username},</p>
        <p>Please click on the following link to activate your account:</p>
        <p><a href="{activation_link}">Activate Account</a></p>
        <p>If you did not create an account, please ignore this email.</p>
    </body>
    </html>
    """

    return email_service.send_email(user.email, subject, text_content, html_content)
