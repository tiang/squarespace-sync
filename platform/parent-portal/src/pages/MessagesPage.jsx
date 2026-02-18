import { Icon } from '@iconify/react';

export default function MessagesPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Messages</h1>
        <p className="text-slate-500">Communicate with your instructors and campus team.</p>
      </div>

      <div className="text-center py-24 text-slate-400">
        <Icon icon="lucide:message-circle" className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="font-medium mb-1">No messages yet</p>
        <p className="text-sm mb-6">Your conversations with instructors will appear here.</p>
        <button className="px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors">
          Message Your Instructor
        </button>
      </div>
    </div>
  );
}
