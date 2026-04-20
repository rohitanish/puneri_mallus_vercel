import { NextResponse } from 'next/server';
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("punerimallus");
    const settings = await db.collection("settings").findOne({ type: "mallu_mart" });
    
    // 🔥 Ensure we return a valid object even if DB is empty
    return NextResponse.json(settings || { isPaymentEnabled: false, accessPrice: 99 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("punerimallus");

    // Remove _id if it exists in the body to prevent Mongo errors during update
    const { _id, ...updateData } = body;

    await db.collection("settings").updateOne(
      { type: "mallu_mart" },
      { $set: { ...updateData, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}