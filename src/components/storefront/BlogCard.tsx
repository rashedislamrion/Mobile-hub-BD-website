"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/api-client";

export interface BlogItemProps {
  id: string;
  title: string;
  slug: string;
  author?: string | { id?: string; name?: string } | null;
  excerpt?: string | null;
  coverImage?: string | null;
  viewCount?: number;
  createdAt: string | Date;
}

export function BlogCard({ blog }: { blog: BlogItemProps }) {
  const viewCount = blog.viewCount ?? (blog as any).views ?? 0;
  const isNew = viewCount < 1000;
  const authorName = typeof blog.author === 'string' ? blog.author : blog.author?.name || 'MobileHubBD';
  const coverImg = blog.coverImage || (blog as any).featuredImage;

  return (
    <article className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      <Link href={`/blog/${blog.slug}`} className="relative block aspect-[3/2] overflow-hidden bg-slate-100 w-full">
        {isNew && (
          <Badge className="absolute top-3 left-3 z-10 bg-emerald-600 text-white border-none shadow-sm font-semibold">
            NEW
          </Badge>
        )}
        <img 
          src={coverImg ? getImageUrl(coverImg) : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'} 
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
          <span className="text-emerald-600 font-semibold">{authorName}</span>
          <span>•</span>
          <time dateTime={typeof blog.createdAt === 'string' ? blog.createdAt : blog.createdAt.toISOString()}>
            {format(new Date(blog.createdAt), 'MMM dd, yyyy')}
          </time>
        </div>
        
        <Link href={`/blog/${blog.slug}`} className="block mb-2 flex-1">
          <h3 className="text-lg font-bold text-slate-800 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>
        </Link>
        
        {blog.excerpt && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {blog.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <Link href={`/blog/${blog.slug}`} className="text-sm font-semibold text-emerald-600 hover:underline">
            Read More
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Eye className="w-4 h-4" />
            <span>{viewCount.toLocaleString()} Views</span>
          </div>
        </div>
      </div>
    </article>
  );
}
