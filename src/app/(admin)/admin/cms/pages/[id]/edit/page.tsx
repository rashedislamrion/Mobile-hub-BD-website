'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminPage } from '@/contexts/AdminPageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, Type, Bold, Italic, Link as LinkIcon, List, Image as ImageIcon } from 'lucide-react';

export default function EditCmsPage() {
  const router = useRouter();
  const { setPageInfo } = useAdminPage();
  const [isSeoOpen, setIsSeoOpen] = useState(false);

  React.useEffect(() => {
    setPageInfo({
      title: 'Edit Page',
      breadcrumbs: [
        { label: 'CMS', href: '/admin/cms/pages' },
        { label: 'Pages', href: '/admin/cms/pages' },
        { label: 'Edit', href: '#' }
      ]
    });
  }, [setPageInfo]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT COLUMN: Main Form */}
      <div className="flex-1 space-y-6">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800">Content</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Page Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Return Policy"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. /return-policy"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm text-slate-600"
              />
              <p className="text-xs text-slate-500 mt-1">This will be the URL of the page. Use lowercase and hyphens only.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Page Content</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-1">
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"><Type className="w-4 h-4" /></button>
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"><Bold className="w-4 h-4" /></button>
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"><Italic className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"><LinkIcon className="w-4 h-4" /></button>
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"><List className="w-4 h-4" /></button>
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"><ImageIcon className="w-4 h-4" /></button>
                </div>
                <textarea 
                  rows={15}
                  placeholder="Write your page content here..."
                  className="w-full p-4 focus:outline-none resize-y min-h-[300px]"
                ></textarea>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Accordion */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer select-none"
            onClick={() => setIsSeoOpen(!isSeoOpen)}
          >
            <h3 className="text-lg font-semibold text-slate-800">Search Engine Optimization (SEO)</h3>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isSeoOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isSeoOpen && (
            <div className="p-6 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  placeholder="Optimal length is 50-60 characters"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  placeholder="Optimal length is 150-160 characters"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* RIGHT COLUMN: Sticky Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-800">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none">
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/cms/pages')}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Page saved!');
                    router.push('/admin/cms/pages');
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Save Page
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
