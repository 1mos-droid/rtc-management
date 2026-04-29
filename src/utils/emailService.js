import { supabase } from '../supabase';

/**
 * Formal email notification system.
 * SECURITY: This now calls a Supabase Edge Function to keep the Resend API Key secure.
 * The Edge Function ('send-role-email') handles the actual Resend API interaction.
 */

export const sendRoleChangeEmail = async (userData, oldRole, newRole, department = null) => {
  try {
    const isPromotion = getRoleLevel(newRole) > getRoleLevel(oldRole);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-role-email', {
      body: {
        to: userData.email,
        name: userData.name,
        oldRole,
        newRole,
        department,
        isPromotion
      }
    });

    if (error) throw error;

    console.log("Email request sent to Edge Function:", data);
    return data;
  } catch (error) {
    console.error("Edge Function Email Error:", error.message);
    
    // Fallback to simulation in development if the edge function isn't deployed
    if (import.meta.env.DEV) {
      return simulateEmail(userData, oldRole, newRole, department);
    }
    throw error;
  }
};

const simulateEmail = async (userData, oldRole, newRole, department) => {
  console.log("%c--- [DEV ONLY] SIMULATED FORMAL EMAIL ---", "color: #4A6741; font-weight: bold;");
  console.log(`To: ${userData.email}`);
  console.log(`Action: Role change from ${oldRole} to ${newRole}${department ? ` in ${department}` : ''}`);
  return new Promise(resolve => setTimeout(resolve, 500));
};

const getRoleLevel = (role) => {
  const levels = {
    'developer': 4,
    'admin': 3,
    'department_head': 2,
    'member': 1
  };
  return levels[role] || 0;
};
