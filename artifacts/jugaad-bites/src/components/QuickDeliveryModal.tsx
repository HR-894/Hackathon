// =========================================================================
// JugaadBites: 10-Minute Quick Commerce Delivery Modal
// Seamless instant integration with Zepto, Blinkit, and Swiggy Instamart
// Allows students & beginners to order missing spices & groceries in 10 mins
// =========================================================================

import React, { useState } from 'react';
import { ShoppingBag, Zap, ExternalLink, X, Check, Copy } from 'lucide-react';
import { sounds } from '@/lib/sound';

interface QuickDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  missingItems: string[];
}

export function QuickDeliveryModal({
  isOpen,
  onClose,
  recipeName,
  missingItems,
}: QuickDeliveryModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedStore, setSelectedStore] = useState<'blinkit' | 'zepto' | 'instamart'>('blinkit');

  if (!isOpen) return null;

  const cleanItems = missingItems.map((i) => i.replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean);
  const primarySearchItem = cleanItems[0] || 'Groceries';

  // Store Deeplinks
  const getStoreUrl = (store: 'blinkit' | 'zepto' | 'instamart', query: string) => {
    const encoded = encodeURIComponent(query);
    switch (store) {
      case 'blinkit':
        return `https://blinkit.com/s/?q=${encoded}`;
      case 'zepto':
        return `https://www.zeptonow.com/search?query=${encoded}`;
      case 'instamart':
        return `https://www.swiggy.com/instamart/search?custom_back=true&query=${encoded}`;
    }
  };

  const handleCopyList = () => {
    const list = cleanItems.map((i) => `• ${i}`).join('\n');
    navigator.clipboard.writeText(`🛒 JugaadBites Missing Ingredients for ${recipeName}:\n${list}`).catch(() => {});
    setCopied(true);
    sounds.playCheck();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenStore = (item: string) => {
    sounds.playPop();
    const url = getStoreUrl(selectedStore, item);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#ded4c1] dark:border-[#2a3c45] bg-[#fffdf9] dark:bg-[#152026] p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-[#52636a] dark:text-[#8ba098] hover:bg-[#ede3cf] dark:hover:bg-[#203038] transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e65e3d] text-white shadow-md">
            <Zap size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#16202a] dark:text-[#f3eee4]">
              ⚡ Get Missing Items in 10 Mins
            </h3>
            <p className="text-xs text-[#52636a] dark:text-[#8ea299] font-medium">
              Instant delivery for <span className="font-semibold text-[#e65e3d]">{recipeName}</span>
            </p>
          </div>
        </div>

        {/* Store Selector Tabs */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { id: 'blinkit' as const, name: 'Blinkit', color: 'border-[#f4c453] bg-[#fdf8eb] text-[#8c6700] dark:bg-[#2a2412] dark:text-[#f7d377]', tag: '⚡ 10 min' },
            { id: 'zepto' as const, name: 'Zepto', color: 'border-[#ec4899] bg-[#fdf2f8] text-[#be185d] dark:bg-[#2b1220] dark:text-[#f472b6]', tag: '🚀 9 min' },
            { id: 'instamart' as const, name: 'Instamart', color: 'border-[#f97316] bg-[#fff7ed] text-[#c2410c] dark:bg-[#2d170b] dark:text-[#fb923c]', tag: '🛵 12 min' }
          ].map((store) => (
            <button
              key={store.id}
              onClick={() => {
                sounds.playPop();
                setSelectedStore(store.id);
              }}
              className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all text-xs font-bold ${
                selectedStore === store.id
                  ? `${store.color} shadow-sm ring-2 ring-[#e65e3d]/30`
                  : 'border-[#ded4c1] dark:border-[#2a3c45] bg-[#f8f5ee] dark:bg-[#10171a] text-[#52636a] dark:text-[#7f948c] opacity-75'
              }`}
            >
              <span>{store.name}</span>
              <span className="text-[0.65rem] opacity-90">{store.tag}</span>
            </button>
          ))}
        </div>

        {/* Missing Ingredient Items */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#61747d] dark:text-[#84958f]">
            Tap item to search on {selectedStore.toUpperCase()}:
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {cleanItems.length === 0 ? (
              <p className="text-xs italic text-[#61747d] dark:text-[#7f918b]">
                You have all main ingredients! No delivery needed.
              </p>
            ) : (
              cleanItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[#ded4c1] dark:border-[#27373f] bg-[#fbf8f0] dark:bg-[#11181c] p-3 text-sm"
                >
                  <span className="font-semibold text-[#16202a] dark:text-[#e4efe9]">{item}</span>
                  <button
                    onClick={() => handleOpenStore(item)}
                    className="flex items-center gap-1 rounded-lg bg-[#166e64] dark:bg-[#207c72] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#115e54] transition active:scale-95"
                  >
                    <span>Search</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-[#ede3cf] dark:border-[#27373f]">
          <button
            onClick={handleCopyList}
            className="flex items-center gap-1.5 rounded-xl border border-[#ded4c1] dark:border-[#2a3c45] bg-[#f8f5ee] dark:bg-[#12191d] px-3.5 py-2 text-xs font-bold text-[#374950] dark:text-[#c4d7cf] hover:border-[#166e64] transition active:scale-95"
          >
            {copied ? <Check size={14} className="text-[#166e64]" /> : <Copy size={14} />}
            <span>{copied ? 'Copied List!' : 'Copy Shopping List'}</span>
          </button>

          <button
            onClick={() => handleOpenStore(primarySearchItem)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#e65e3d] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#d95334] transition active:scale-95"
          >
            <ShoppingBag size={14} />
            <span>Open {selectedStore.toUpperCase()} Store</span>
          </button>
        </div>
      </div>
    </div>
  );
}
