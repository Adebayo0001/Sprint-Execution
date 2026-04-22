import emailjs from '@emailjs/browser';
import { WHATSAPP_GROUP_EXECUTORS, WHATSAPP_GROUP_SUPPORT, SUPPORT_EMAIL } from '../constants';

interface Applicant {
  full_name: string;
  email: string;
  goal: string;
}

export const sendConfirmationEmail = async (applicant: Applicant, track: 'sprint' | 'builders') => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const sprintTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_SPRINT;
  const buildersTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_BUILDERS;

  if (!serviceId || !publicKey) {
    console.warn('EmailJS missing environment variables');
    return;
  }

  const templateId = track === 'builders' ? buildersTemplateId : sprintTemplateId;
  
  if (!templateId) {
    console.warn(`Template ID for ${track} not found`);
    return;
  }

  const templateParams = {
    name: applicant.full_name,
    email: applicant.email,
    goal: applicant.goal,
    sprint_group_link: WHATSAPP_GROUP_EXECUTORS,
    reply_to: SUPPORT_EMAIL,
    from_email: SUPPORT_EMAIL,
    ...(track === 'builders' && { builders_group_link: WHATSAPP_GROUP_SUPPORT }),
  };

  try {
    const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Confirmation email sent successfully:', result.text);
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};
