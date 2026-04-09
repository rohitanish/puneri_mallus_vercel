import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import { sendPendingCommunityEmail, sendApprovedCommunityEmail, sendAdminPendingAlert } from '@/lib/mail';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getFileName = (url: string) => {
  if (!url || !url.includes('community/')) return null;
  const parts = url.split('community/')[1]; 
  return parts.split('?')[0];
};

export async function POST(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("punerimallus");
    const data = await req.json();
    const { _id, ...body } = data;

    if (body.category) body.category = body.category.toUpperCase();

    if (_id) {
      if (!ObjectId.isValid(_id)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
      }

      const oldNode = await db.collection("community_circles").findOne({ 
        _id: new ObjectId(_id) 
      });

      if (oldNode) {
        /**
         * 🔥 SAFE IMAGE CLEANUP
         * We only run cleanup if 'image' or 'imagePaths' are present in the request body.
         * This prevents images from being deleted when just toggling 'isApproved' from the dashboard.
         */
        if (body.image || body.imagePaths) {
          const oldImages = new Set([oldNode.image, ...(oldNode.imagePaths || [])].filter(Boolean));
          const newImages = new Set([body.image, ...(body.imagePaths || [])].filter(Boolean));

          const filesToDelete = Array.from(oldImages)
            .filter(url => !newImages.has(url))
            .map(url => getFileName(url))
            .filter(Boolean) as string[];

          if (filesToDelete.length > 0) {
            try {
              await supabaseAdmin.storage.from('community').remove(filesToDelete);
            } catch (err) {
              console.error("ASSET_CLEANUP_WARNING:", err);
            }
          }
        }

        // EMAIL LOGIC: CHECK FOR APPROVAL (Status change from false to true)
        if (!oldNode.isApproved && body.isApproved === true) {
          const submitterEmail = oldNode.submittedBy || body.submittedBy;
          if (submitterEmail) {
            const adminIdentifier = body.approvedBy || "Tribe Moderator"; 
            // Trigger the professional live email
            await sendApprovedCommunityEmail(submitterEmail, body.title || oldNode.title, adminIdentifier, _id);
          }
        }
      }

      // Update document
      await db.collection("community_circles").updateOne(
        { _id: new ObjectId(_id) },
        { 
          $set: { 
            ...body, 
            updatedAt: new Date() 
          } 
        }
      );
      
      return NextResponse.json({ message: "Node successfully updated" });
    } else {
      // NEW SUBMISSION LOGIC
      const result = await db.collection("community_circles").insertOne({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
        isApproved: body.isApproved ?? false, 
        isVerified: body.isVerified || false,
        services: body.services || []
      });

      // EMAIL LOGIC: USER NOTIFICATION & ADMIN ALERT
      if (body.submittedBy && !body.isApproved) {
        await sendPendingCommunityEmail(body.submittedBy, body.title);

        try {
          const pendingCount = await db.collection("community_circles").countDocuments({ 
            isApproved: false 
          });
          await sendAdminPendingAlert(body.title, pendingCount);
        } catch (adminMailErr) {
          console.error("ADMIN_NOTIFY_ERROR:", adminMailErr);
        }
      }
      
      return NextResponse.json(result);
    }
  } catch (e: any) {
    console.error("COMMUNITY_MANAGE_CRITICAL_ERROR:", e);
    return NextResponse.json({ error: "Storage or database sync failed" }, { status: 500 });
  }
}