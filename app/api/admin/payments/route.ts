import { NextResponse } from 'next/server';
import clientPromise from "@/lib/mongodb";

export const dynamic = 'force-dynamic'; // Ensures fresh data every time

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("punerimallus");
    
    // Fetch all payments, sorted by newest first
    const payments = await db.collection("payments")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(payments);
  } catch (error) {
    console.error("ADMIN_PAYMENT_FETCH_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}