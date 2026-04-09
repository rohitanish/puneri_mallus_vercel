"use client";
import NodeDetails from '@/components/community/NodeDetails';

/**
 * DYNAMIC ID PAGE
 * This page uses the shared NodeDetails component to display
 * the full profile of a Samajam, Temple, or Organization.
 */
export default function CommunityMemberPage() {
  return (
    <div className="min-h-screen bg-[#030303]">
      <NodeDetails isAdminView={false} />
    </div>
  );
}