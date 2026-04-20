import { NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from "@/lib/mongodb";
// 🔥 IMPORT YOUR NEW EMAIL FUNCTIONS
import { sendMartSubscriptionEmail, sendPremiumMembershipEmail } from "@/lib/mail";
import { createClient } from '@supabase/supabase-js';
export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,        
      userEmail, // 🔥 Extract the user's email from the frontend payload
      paymentType, // "MART" or "LIFETIME"
      plan // "MONTHLY", "YEARLY", or "LIFETIME"
    } = await req.json();

    // 1. Create the signature string for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    // 2. Verify Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");
    // Use the SERVICE_ROLE_KEY to bypass RLS securely from the server
    const isAuthentic = expectedSignature === razorpay_signature;
    const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);
// Then insert like this:
await supabaseAdmin.from('payments').insert({
  supabase_id: userId,
  user_email: userEmail,
  razorpay_order_id: razorpay_order_id,
  razorpay_payment_id: razorpay_payment_id,
  type: paymentType,
  plan: plan,
  status: 'SUCCESS'
});
    if (!isAuthentic) {
      return NextResponse.json({ message: "Invalid signature", success: false }, { status: 400 });
    }

    // 3. Database Connection
    const client = await clientPromise;
    const db = client.db("punerimallus");

    // 4. Log the transaction for your financial records
    await db.collection("payments").insertOne({
      supabase_id: userId,
      user_email: userEmail, // 🔥 Save email for your records
      razorpay_order_id,
      razorpay_payment_id,
      type: paymentType,
      plan: plan, // Log the selected plan
      status: "SUCCESS",
      createdAt: new Date()
    });

    // 5. DYNAMIC UPDATE LOGIC: Determine Expiration
    let updateData: any = {};
    const now = new Date();

    if (paymentType === "LIFETIME") {
      // Global Inner Circle Premium Member
      updateData = { $set: { isPremiumMember: true, martUnlocked: true } };
    } 
    else if (paymentType === "MART") {
      // Subscription calculations
      if (plan === "MONTHLY") {
        updateData = { 
          $set: { 
            martUnlocked: true, 
            martPlan: "MONTHLY",
            martExpiresAt: new Date(now.setMonth(now.getMonth() + 1)) 
          } 
        };
      } else if (plan === "YEARLY") {
        updateData = { 
          $set: { 
            martUnlocked: true, 
            martPlan: "YEARLY",
            martExpiresAt: new Date(now.setFullYear(now.getFullYear() + 1)) 
          } 
        };
      } else if (plan === "LIFETIME") {
        updateData = { 
          $set: { 
            martUnlocked: true, 
            martPlan: "LIFETIME" 
          },
          $unset: { martExpiresAt: "" } // If they upgrade to lifetime, remove expiration
        };
      }
    }

    // 6. SYNCED UPDATE
    const updateResult = await db.collection("profiles").updateOne(
      { supabase_id: userId }, 
      updateData,
      { upsert: true }
    );

    if (updateResult.matchedCount === 0) {
      console.warn(`Payment verified but no profile found for supabase_id: ${userId}`);
    }

    // 7. 🔥 FIRE THE APPROPRIATE EMAIL NOTIFICATION
    if (userEmail) {
      if (paymentType === "LIFETIME") {
        await sendPremiumMembershipEmail(userEmail, razorpay_order_id, razorpay_payment_id);
      } else if (paymentType === "MART") {
        await sendMartSubscriptionEmail(userEmail, plan, razorpay_order_id, razorpay_payment_id);
      }
    }

    return NextResponse.json({ 
      message: "Payment verified, access granted, and email sent.", 
      success: true 
    });

  } catch (error: any) {
    console.error("VERIFICATION_CRITICAL_ERROR:", error);
    return NextResponse.json({ error: "Verification failed internally" }, { status: 500 });
  }
}