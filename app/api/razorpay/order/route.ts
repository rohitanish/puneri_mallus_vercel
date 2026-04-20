import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import clientPromise from "@/lib/mongodb";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    // 🔥 UPDATED: Now accepting 'plan' from the frontend
    const { businessId, paymentType, plan } = await req.json();

    const client = await clientPromise;
    const db = client.db("punerimallus");
    const settings = await db.collection("settings").findOne({});

    // 🔥 LOGIC: Determine the dynamic price based on the selected plan
    let targetPrice = 99; // Default fallback
    
    if (paymentType === "LIFETIME") {
      // Global Inner Circle Premium Membership
      targetPrice = settings?.membershipPrice || 499;
    } else if (paymentType === "MART") {
      // Mallu Mart Specific Access
      if (plan === "MONTHLY") targetPrice = settings?.martMonthlyPrice || 99;
      else if (plan === "YEARLY") targetPrice = settings?.martYearlyPrice || 899;
      else if (plan === "LIFETIME") targetPrice = settings?.martLifetimePrice || 2499;
    }

    // Convert to Paise (Integer only)
    const amountInPaise = Math.round(Number(targetPrice) * 100);

    if (amountInPaise < 100) {
      return NextResponse.json({ error: "Amount too low (Min ₹1)" }, { status: 400 });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${paymentType}_${Date.now()}`,
      notes: {
        paymentType: paymentType, 
        targetId: businessId || "GLOBAL",
        plan: plan || "NONE" // Passing the plan to Razorpay so it comes back in verification
      }
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("RAZORPAY_ORDER_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" }, 
      { status: 500 }
    );
  }
}