import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const isAdmin = searchParams.get('admin') === 'true'; // Capture admin flag

    const client = await clientPromise;
    const db = client.db("punerimallus");

    // Case 1: Fetch a specific Circle by ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }

      const circle = await db.collection("community_circles").findOne({ 
        _id: new ObjectId(id) 
      });

      if (!circle) {
        return NextResponse.json({ error: "Node not found" }, { status: 404 });
      }

      return NextResponse.json(circle);
    }

    // Case 2: Fetch All (Unified Grid)
    // ADMIN: Sees {} (Empty filter = all documents)
    // PUBLIC: Sees only approved items. 
    // We use $ne: false to include items where isApproved is true OR missing (legacy data)
    const filter = isAdmin ? {} : { isApproved: { $ne: false } };

    const circles = await db.collection("community_circles")
      .find(filter)
      .sort({ isVerified: -1, title: 1 }) 
      .toArray();
      
    return NextResponse.json(circles);
  } catch (e: any) {
    console.error("COMMUNITY_API_ERROR:", e);
    return NextResponse.json({ error: "Failed to sync with grid" }, { status: 500 });
  }
}