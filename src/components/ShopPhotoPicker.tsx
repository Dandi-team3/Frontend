import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import './ShopPhotoPicker.css';

type ShopPhotoPickerProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  editable: boolean;
};

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

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

export default function ShopPhotoPicker({ file, onChange, editable }: ShopPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionId = useRef(0);
  const inputId = useId();
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => { selectionId.current += 1; }, []);

  const choosePhoto = () => inputRef.current?.click();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!nextFile) return;
    const currentSelection = ++selectionId.current;
    setIsReading(false);

    if (!nextFile.type.startsWith('image/')) {
      setError('이미지 파일을 선택해 주세요.');
      return;
    }
    if (nextFile.size > MAX_PHOTO_SIZE) {
      setError('10MB 이하의 사진을 선택해 주세요.');
      return;
    }

    setError(null);
    setIsReading(true);
    const temporaryUrl = URL.createObjectURL(nextFile);
    try {
      const image = new Image();
      image.src = temporaryUrl;
      await image.decode();
      if (currentSelection === selectionId.current) onChange(nextFile);
    } catch {
      if (currentSelection === selectionId.current) {
        setError('이 사진을 열 수 없어요. JPG, PNG, WEBP 등 다른 이미지로 선택해 주세요.');
      }
    } finally {
      URL.revokeObjectURL(temporaryUrl);
      if (currentSelection === selectionId.current) setIsReading(false);
    }
  };

  const removePhoto = () => {
    selectionId.current += 1;
    setError(null);
    setIsReading(false);
    onChange(null);
  };

  const photo = previewUrl
    ? <img className="shop-photo-preview" src={previewUrl} alt="등록한 가게 사진" />
    : <PhotoPlaceholder editable={editable} />;

  return (
    <div className="shop-photo-picker">
      {editable ? (
        <>
          <input ref={inputRef} id={inputId} type="file" accept="image/*" hidden aria-label="가게 사진 파일 선택" onChange={handleFileChange} />
          <button
            type="button"
            className={`shop-photo-surface${previewUrl ? ' has-photo' : ''}`}
            aria-label={file ? '가게 사진 변경하기' : '가게 사진 추가하기'}
            aria-describedby={error ? errorId : helperId}
            aria-busy={isReading}
            onClick={choosePhoto}
          >
            {photo}
          </button>
          <div className="shop-photo-controls">
            <span id={helperId} className="flow-caption" role="status">{isReading ? '사진 확인 중이에요…' : '이미지 파일 · 최대 10MB'}</span>
            {file && (
              <div className="shop-photo-actions">
                <button type="button" onClick={choosePhoto}>사진 변경</button>
                <button type="button" aria-label="가게 사진 삭제" onClick={removePhoto}>삭제</button>
              </div>
            )}
          </div>
          {error && <p id={errorId} className="flow-error" role="alert">{error}</p>}
        </>
      ) : (
        <div className={`shop-photo-surface${previewUrl ? ' has-photo' : ''}`}>{photo}</div>
      )}
    </div>
  );
}
