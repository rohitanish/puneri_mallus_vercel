import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to extract filename safely from the 'community' bucket
const getFileName = (url: string) => {
  if (!url || !url.includes('community/')) return null;
  const parts = url.split('/');
  const fileNameWithParams = parts[parts.length - 1];
  return fileNameWithParams.split('?')[0];
};

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("punerimallus");

    // 1. Fetch node to get ALL asset references before database deletion
    const node = await db.collection("community_circles").findOne({ 
      _id: new ObjectId(id) 
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // 2. Comprehensive Asset Purge from 'community' bucket
    const allAssetUrls = new Set([
      node.image, 
      ...(node.imagePaths || [])
    ].filter(Boolean));

    const filesToDelete = Array.from(allAssetUrls)
      .map(url => getFileName(url))
      .filter(Boolean) as string[];

    if (filesToDelete.length > 0) {
      try {
        const { error: storageError } = await supabaseAdmin.storage
          .from('community') // Using your existing bucket
          .remove(filesToDelete);

        if (storageError) {
          console.error("SUPABASE_STORAGE_PURGE_ERROR:", storageError);
        }
      } catch (err) {
        console.error("ASSET_PURGE_CRITICAL_WARNING:", err);
      }
    }

    // 3. Delete from Database
    const result = await db.collection("community_circles").deleteOne({ 
      _id: new ObjectId(id) 
    });

    return NextResponse.json({ 
      message: "Node and all associated gallery assets dissolved",
      deletedCount: result.deletedCount 
    });

  } catch (e: any) {
    console.error("COMMUNITY_DELETE_CRITICAL_ERROR:", e);
    return NextResponse.json({ error: "Dissolution protocol failed" }, { status: 500 });
  }
}