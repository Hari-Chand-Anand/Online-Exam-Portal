import { Resend } from "resend";
import { getBaseUrl } from "@/lib/utils";

export async function sendExamInvite(email: string, name: string, examId: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.log(`[email placeholder] Invite ${email} to exam ${examId}`);
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const link = `${getBaseUrl()}/candidate/exams/${examId}/instructions`;
  return resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your intern online exam invitation",
    html: `<p>Hi ${name},</p><p>You are invited to take the intern online exam.</p><p><a href="${link}">Start exam</a></p>`
  });
}
