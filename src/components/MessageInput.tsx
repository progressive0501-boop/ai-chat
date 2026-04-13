import { useRef, useEffect, useCallback } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type AttachedImage = {
  id: string;
  dataUrl: string;
  mediaType: string;
  name: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  attachments: AttachedImage[];
  onAttach: (images: AttachedImage[]) => void;
  onRemoveAttachment: (id: string) => void;
};

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  attachments,
  onAttach,
  onRemoveAttachment,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // テキスト量に応じて textarea の高さを自動調整
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const processFiles = useCallback(
    async (files: File[]) => {
      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        alert("画像ファイルが大きすぎます（最大 5MB）。サイズを小さくしてから添付してください。");
      }

      const validFiles = files.filter(
        (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
      );
      if (validFiles.length === 0) return;

      const newImages: AttachedImage[] = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise<AttachedImage>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  id: crypto.randomUUID(),
                  dataUrl: reader.result as string,
                  mediaType: file.type,
                  name: file.name,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      onAttach(newImages);
    },
    [onAttach]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter(
        (item) => item.kind === "file" && ALLOWED_TYPES.includes(item.type)
      );
      if (imageItems.length === 0) return;

      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
      processFiles(files);
    },
    [processFiles]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (value.trim() || attachments.length > 0)) {
        onSubmit();
      }
    }
  };

  const canSubmit = !isLoading && (!!value.trim() || attachments.length > 0);

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 max-w-3xl mx-auto">
          {attachments.map((att) => (
            <div key={att.id} className="relative group">
              <img
                src={att.dataUrl}
                alt={att.name}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => onRemoveAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="画像を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 w-11 h-11 rounded-full border border-gray-300 bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="画像を添付"
          title="画像を添付（JPEG/PNG/GIF/WebP、最大5MB）"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isLoading}
          placeholder="メッセージを入力… (Enter で送信 / Shift+Enter で改行)"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50 transition-all"
        />
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow"
          aria-label="送信"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        Shift+Enter で改行 / 📎 で画像添付 / Ctrl+V でスクリーンショット貼り付け
      </p>
    </div>
  );
}
