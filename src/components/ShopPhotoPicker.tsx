import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import './ShopPhotoPicker.css';

type ShopPhotoPickerProps = {
  files: File[];
  onChange: (files: File[]) => void;
  editable: boolean;
};

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 5;

function PhotoPlaceholder({ editable }: { editable: boolean }) {
  return (
    <>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3M10 20v-5h4v5" />
      </svg>
      <span>{editable ? '가게 사진 추가하기' : '가게 사진'}</span>
    </>
  );
}

async function canOpenImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ShopPhotoPicker({ files, onChange, editable }: ShopPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionId = useRef(0);
  const inputId = useId();
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => () => { selectionId.current += 1; }, []);

  const choosePhotos = () => inputRef.current?.click();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (selected.length === 0) return;
    const currentSelection = ++selectionId.current;

    const messages = new Set<string>();
    const remaining = MAX_PHOTOS - files.length;
    if (selected.length > remaining) messages.add(`사진은 최대 ${MAX_PHOTOS}장까지 넣을 수 있어요.`);

    const candidates = selected.slice(0, remaining).filter((file) => {
      if (!file.type.startsWith('image/')) {
        messages.add('이미지 파일만 넣을 수 있어요.');
        return false;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        messages.add('10MB 이하의 사진만 넣을 수 있어요.');
        return false;
      }
      return true;
    });

    setError(null);
    setIsReading(true);
    const readable = await Promise.all(candidates.map(canOpenImage));
    if (currentSelection !== selectionId.current) return;
    setIsReading(false);

    if (readable.includes(false)) messages.add('열 수 없는 사진은 뺐어요. JPG, PNG, WEBP 등 다른 이미지로 선택해 주세요.');
    const accepted = candidates.filter((_, index) => readable[index]);
    if (accepted.length > 0) onChange([...files, ...accepted]);
    setError(messages.size > 0 ? [...messages].join(' ') : null);
  };

  const removePhoto = (index: number) => {
    setError(null);
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  if (!editable) {
    return (
      <div className="shop-photo-picker">
        {previewUrls.length > 0 ? (
          <ul className="shop-photo-grid">
            {previewUrls.map((url, index) => (
              <li key={url} className="shop-photo-item">
                <img className="shop-photo-preview" src={url} alt={`가게 사진 ${index + 1}`} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="shop-photo-surface"><PhotoPlaceholder editable={false} /></div>
        )}
      </div>
    );
  }

  return (
    <div className="shop-photo-picker">
      <input ref={inputRef} id={inputId} type="file" accept="image/*" multiple hidden aria-label="가게 사진 파일 선택" onChange={handleFileChange} />
      {previewUrls.length > 0 ? (
        <ul className="shop-photo-grid">
          {previewUrls.map((url, index) => (
            <li key={url} className="shop-photo-item">
              <img className="shop-photo-preview" src={url} alt={`등록한 가게 사진 ${index + 1}`} />
              <button type="button" className="shop-photo-remove" aria-label={`가게 사진 ${index + 1} 삭제`} disabled={isReading} onClick={() => removePhoto(index)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
          {files.length < MAX_PHOTOS && (
            <li>
              <button type="button" className="shop-photo-add" aria-label="가게 사진 더 추가하기" aria-describedby={error ? errorId : helperId} aria-busy={isReading} disabled={isReading} onClick={choosePhotos}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </li>
          )}
        </ul>
      ) : (
        <button type="button" className="shop-photo-surface" aria-label="가게 사진 추가하기" aria-describedby={error ? errorId : helperId} aria-busy={isReading} disabled={isReading} onClick={choosePhotos}>
          <PhotoPlaceholder editable />
        </button>
      )}
      <div className="shop-photo-controls">
        <span id={helperId} className="flow-caption" role="status">
          {isReading ? '사진 확인 중이에요…' : '이미지 파일 · 장당 최대 10MB'}
        </span>
        <span className="flow-caption">{files.length}/{MAX_PHOTOS}</span>
      </div>
      {error && <p id={errorId} className="flow-error" role="alert">{error}</p>}
    </div>
  );
}
