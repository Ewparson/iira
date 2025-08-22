// backend/demo-email.js

const nodemailer = require("nodemailer");

async function demo() {
  // 1) Create a test account
  const testAccount = await nodemailer.createTestAccount();

  // 2) Create a transporter using the test SMTP service
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // 3) Send a “verification” email to your persona address
  const info = await transporter.sendMail({
    from: '"iira.ai Demo" <no-reply@iira.ai>',
    to: "Emaanwilson@gmail.com",
    subject: "🔒 iira.ai Demo Verification",
    html: `
      <p>Hello Emaan,</p>
      <p>This is a demo verification link:</p>
      <p><a href="http://localhost:3000/verify?token=DEMO_TOKEN">Verify your account</a></p>
      <p>(This link is just for demo purposes.)</p>
    `,
  });

  // 4) Preview URL in your console
  console.log("Preview email at:", nodemailer.getTestMessageUrl(info));
}

demo().catch(err => {
  console.error("Error sending demo email:", err);
  process.exit(1);
});
