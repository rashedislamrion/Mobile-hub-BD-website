"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { BACKEND_URL } from "@/lib/api-client";

interface CustomerAvatarProps {
  photo?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-24 h-24 text-xl",
};

const bgColors = [
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
];

function getInitials(name?: string | null): string {
  if (!name) return "C";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name?: string | null): string {
  if (!name) return bgColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % bgColors.length;
  return bgColors[index];
}

export function CustomerAvatar({
  photo,
  name,
  size = "md",
  className = "",
}: CustomerAvatarProps) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const initials = getInitials(name);
  const colorClass = getColor(name);

  // Normalize image URL: if relative path e.g. /uploads/..., prefix with backend URL if needed
  const resolvedPhoto = photo
    ? photo.startsWith("http")
      ? photo
      : `${BACKEND_URL}${photo.startsWith("/") ? "" : "/"}${photo}`
    : null;

  if (resolvedPhoto) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 border border-slate-200 bg-slate-100 ${sizeClass} ${className}`}
      >
        <Image
          src={resolvedPhoto}
          alt={name || "Customer"}
          fill
          sizes="96px"
          className="object-cover"
          unoptimized
          onError={(e) => {
            // If image fails to load, fallback can be handled
            const target = e.target as HTMLElement;
            target.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 border select-none ${sizeClass} ${colorClass} ${className}`}
      title={name || "Customer"}
    >
      {initials}
    </div>
  );
}
